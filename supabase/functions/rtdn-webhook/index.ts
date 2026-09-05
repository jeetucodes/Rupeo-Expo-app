/**
 * rtdn-webhook — Supabase Edge Function
 *
 * Handles Real-time Developer Notifications (RTDN) from Google Pub/Sub.
 * Google sends a push notification to this URL whenever a subscription
 * lifecycle event occurs (renewal, cancellation, expiry, upgrade, etc.)
 *
 * Pub/Sub message format (push subscription):
 * {
 *   "message": {
 *     "data": "<base64url-encoded DeveloperNotification JSON>",
 *     "messageId": "...",
 *     "publishTime": "..."
 *   },
 *   "subscription": "projects/.../subscriptions/..."
 * }
 *
 * DeveloperNotification (after decoding):
 * {
 *   "version": "1.0",
 *   "packageName": "com.innovatexlabs.paisewaise",
 *   "eventTimeMillis": "1234567890000",
 *   "subscriptionNotification": {
 *     "version": "1.0",
 *     "notificationType": 2,       ← see NOTIFICATION_TYPE map below
 *     "purchaseToken": "...",
 *     "subscriptionId": "rupeo_premium_monthly"
 *   }
 * }
 *
 * What this function does:
 *   1. Validates webhook secret in URL query param (?secret=...)
 *   2. Decodes base64 Pub/Sub message data
 *   3. For events needing fresh state: calls Google Play subscriptionsv2 API
 *   4. Updates Supabase `subscriptions` table
 *   5. Updates Firestore users/{uid} doc via REST (keeps app's isPremium in sync)
 *   6. Always returns HTTP 200 to acknowledge Pub/Sub (prevents retries)
 *
 * Environment secrets (set via: supabase secrets set KEY=value):
 *   GOOGLE_SA_EMAIL              — service account client_email
 *   GOOGLE_SA_PRIVATE_KEY        — service account private_key (JSON escaped \n)
 *   ANDROID_PACKAGE_NAME         — your app's package name
 *   FIREBASE_PROJECT_ID          — Firebase / GCP project ID (paisewaise-e545e)
 *   RTDN_WEBHOOK_SECRET          — shared secret appended to push URL as ?secret=
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient }           from 'https://esm.sh/@supabase/supabase-js@2';
import { getPlaySubscription, mapPlayStateToStatus } from '../_shared/play-api.ts';
import { updateFirestoreUser }    from '../_shared/firestore-rest.ts';

// ─── Environment ──────────────────────────────────────────────────────────────
const PACKAGE_NAME       = Deno.env.get('ANDROID_PACKAGE_NAME')     ?? 'com.innovatexlabs.paisewaise';
const SA_EMAIL           = Deno.env.get('GOOGLE_SA_EMAIL')           ?? '';
const SA_KEY             = (Deno.env.get('GOOGLE_SA_PRIVATE_KEY')    ?? '').replace(/\\n/g, '\n');
const SUPA_URL           = Deno.env.get('SUPABASE_URL')              ?? '';
const SUPA_SRV_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WEBHOOK_SECRET     = Deno.env.get('RTDN_WEBHOOK_SECRET')       ?? '';
const FIREBASE_PROJECT   = Deno.env.get('FIREBASE_PROJECT_ID')       ?? 'paisewaise-e545e';

// ─── RTDN Notification Type constants ─────────────────────────────────────────
// Source: https://developer.android.com/google/play/billing/rtdn-reference

/** All 13 RTDN notification type codes → human name */
const NOTIFICATION_NAMES: Record<number, string> = {
  1:  'SUBSCRIPTION_RECOVERED',           // Recovered from account hold
  2:  'SUBSCRIPTION_RENEWED',             // Renewed successfully
  3:  'SUBSCRIPTION_CANCELED',            // User cancelled
  4:  'SUBSCRIPTION_PURCHASED',           // New purchase (usually handled client-side too)
  5:  'SUBSCRIPTION_ON_HOLD',             // Payment failed, account hold
  6:  'SUBSCRIPTION_IN_GRACE_PERIOD',     // Payment failed, in grace period (still active!)
  7:  'SUBSCRIPTION_RESTARTED',           // User resubscribed before expiry
  8:  'SUBSCRIPTION_PRICE_CHANGE_CONFIRMED',
  9:  'SUBSCRIPTION_DEFERRED',            // Renewal date was deferred
  10: 'SUBSCRIPTION_PAUSED',              // Subscription paused
  11: 'SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED',
  12: 'SUBSCRIPTION_REVOKED',             // Entitlement revoked (immediate)
  13: 'SUBSCRIPTION_EXPIRED',             // Subscription fully expired
};

/**
 * Notification types that require a fresh Google Play API call
 * to get the current state, expiry date, and basePlanId.
 * (All types that don't have a definitive immediate status)
 */
const NEEDS_PLAY_API = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11]);

/**
 * Notification types with an immediate, deterministic status
 * (no Play API call needed — we know the state from the event type alone)
 */
const IMMEDIATE_STATUS: Record<number, string> = {
  3:  'cancelled',   // SUBSCRIPTION_CANCELED
  12: 'expired',     // SUBSCRIPTION_REVOKED
  13: 'expired',     // SUBSCRIPTION_EXPIRED
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PubSubMessage {
  data: string;      // base64-encoded DeveloperNotification JSON
  messageId: string;
  publishTime: string;
}

interface DeveloperNotification {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: { version: string };
  voidedPurchaseNotification?: { purchaseToken: string; orderId: string; productType: number };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // ── Verify shared secret in URL (?secret=...) ──────────────────────────────
  const url = new URL(req.url);
  if (WEBHOOK_SECRET && url.searchParams.get('secret') !== WEBHOOK_SECRET) {
    console.warn('[rtdn] ❌ Unauthorized — bad secret');
    // Return 200 to prevent Pub/Sub from retrying (it would keep failing)
    return new Response('OK', { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // ── Parse Pub/Sub push body ────────────────────────────────────────────────
  let envelope: { message?: PubSubMessage };
  try {
    envelope = await req.json();
  } catch {
    console.error('[rtdn] Invalid JSON body');
    return new Response('OK', { status: 200 }); // ACK to prevent retry
  }

  const msg = envelope.message;
  if (!msg?.data) {
    console.warn('[rtdn] No message.data — possibly a Pub/Sub control message');
    return new Response('OK', { status: 200 });
  }

  // ── Decode base64 → DeveloperNotification JSON ────────────────────────────
  let notification: DeveloperNotification;
  try {
    // Pub/Sub data is base64url or standard base64
    const decoded = atob(msg.data.replace(/-/g, '+').replace(/_/g, '/'));
    notification = JSON.parse(decoded);
  } catch (err) {
    console.error('[rtdn] Failed to decode message.data:', err);
    return new Response('OK', { status: 200 }); // ACK
  }

  console.log(
    '[rtdn] Received notification — publishTime:', msg.publishTime,
    '| notification:', JSON.stringify(notification),
  );

  // ── Handle test notification (sent by Google when RTDN config is saved) ────
  if (notification.testNotification) {
    console.log('[rtdn] ✅ Test notification received — RTDN connection is working!');
    return new Response(JSON.stringify({ ok: true, type: 'test' }), { status: 200 });
  }

  const sn = notification.subscriptionNotification;
  if (!sn) {
    console.warn('[rtdn] No subscriptionNotification field — skipping');
    return new Response('OK', { status: 200 });
  }

  const { notificationType, purchaseToken, subscriptionId } = sn;
  const typeName = NOTIFICATION_NAMES[notificationType] ?? `UNKNOWN_TYPE_${notificationType}`;

  console.log(
    `[rtdn] Event: ${typeName} (${notificationType})` +
    ` | subscriptionId: ${subscriptionId}` +
    ` | token: ${purchaseToken.substring(0, 24)}...`,
  );

  // ── Process the notification ───────────────────────────────────────────────
  try {
    await processNotification(notificationType, purchaseToken, subscriptionId, msg.publishTime);
  } catch (err: unknown) {
    const msg2 = err instanceof Error ? err.message : String(err);
    console.error('[rtdn] Processing error (non-fatal):', msg2);
    // Return 200 anyway — retrying would likely fail again
  }

  // Always ACK Pub/Sub with HTTP 200
  return new Response(JSON.stringify({ ok: true, type: typeName }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ─── Core processing logic ────────────────────────────────────────────────────

async function processNotification(
  notificationType: number,
  purchaseToken: string,
  subscriptionId: string,
  publishTime: string,
): Promise<void> {
  const supabase = createClient(SUPA_URL, SUPA_SRV_KEY);

  let status: string;
  let basePlanId: string | null = null;
  let expiryTime: string | null = null;

  // ── Determine new status ───────────────────────────────────────────────────
  if (NEEDS_PLAY_API.has(notificationType)) {
    // Fetch ground truth from Google Play
    const playDetails = await getPlaySubscription(
      PACKAGE_NAME, purchaseToken, SA_EMAIL, SA_KEY,
    );
    status     = mapPlayStateToStatus(playDetails.subscriptionState);
    basePlanId = playDetails.basePlanId;
    expiryTime = playDetails.expiryTime;

    console.log(
      `[rtdn] Play API: state=${playDetails.subscriptionState} ` +
      `plan=${basePlanId} expiry=${expiryTime} → status=${status}`,
    );
  } else {
    // Immediate mapping — no API call needed
    status = IMMEDIATE_STATUS[notificationType] ?? 'expired';
    console.log(`[rtdn] Immediate status: ${status}`);
  }

  // ── Find existing record in Supabase ──────────────────────────────────────
  const { data: existing, error: selectError } = await supabase
    .from('subscriptions')
    .select('id, user_id, base_plan_id')
    .eq('purchase_token', purchaseToken)
    .maybeSingle();

  if (selectError) {
    console.error('[rtdn] Supabase SELECT error:', selectError.message);
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    purchase_token: purchaseToken,
    product_id:     subscriptionId,
    status,
    updated_at:     new Date().toISOString(),
  };
  if (basePlanId) updatePayload.base_plan_id = basePlanId;
  if (expiryTime) updatePayload.expiry_date  = expiryTime;

  if (existing) {
    // ── Update existing record ───────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('purchase_token', purchaseToken);

    if (updateError) {
      console.error('[rtdn] Supabase UPDATE error:', updateError.message);
    } else {
      console.log(
        `[rtdn] ✅ Supabase updated — user: ${existing.user_id}` +
        ` | oldPlan: ${existing.base_plan_id} → newPlan: ${basePlanId ?? '(unchanged)'}` +
        ` | status: ${status}`,
      );
    }

    // ── Update Firestore users/{uid} doc via REST ──────────────────────────
    // This keeps the app's isPremium flag in sync without requiring a client refresh
    if (existing.user_id) {
      const isActive = status === 'active' || status === 'grace_period';
      const firestoreFields: Record<string, unknown> = {
        is_premium:                    isActive,
        premium_subscription_status:   status,
        updated_at:                    new Date().toISOString(),
      };
      // Only overwrite plan/expiry if we fetched fresh data from Play
      if (basePlanId) firestoreFields.premium_plan         = basePlanId;
      if (expiryTime) firestoreFields.premium_expiry_date  = expiryTime;
      if (!isActive)  firestoreFields.premium_plan         = null;

      await updateFirestoreUser(
        FIREBASE_PROJECT,
        existing.user_id,
        firestoreFields,
        SA_EMAIL,
        SA_KEY,
      ).catch((err: Error) =>
        console.warn('[rtdn] Firestore update failed (non-critical):', err.message),
      );
    }
  } else {
    // ── No existing record — upsert ──────────────────────────────────────────
    // This can happen if RTDN fires before the client calls verify-subscription
    // (e.g. on a very slow device, or a purchase from another device)
    const { error: insertError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          ...updatePayload,
          // user_id unknown at this point — will be filled by verify-subscription
          user_id:    null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'purchase_token' },
      );

    if (insertError) {
      console.error('[rtdn] Supabase INSERT error:', insertError.message);
    } else {
      console.log('[rtdn] ✅ New subscription record created (user_id TBD)');
    }
  }
}
