/**
 * verify-subscription — Supabase Edge Function
 *
 * Called from the Rupeo app immediately after a successful Google Play purchase.
 * 
 * What this function does:
 *   1. Receives purchase_token + product_id + user_id (Firebase UID) from app
 *   2. Calls Google Play subscriptionsv2.get API to verify the token is genuine
 *      and fetch definitive subscription state (status, expiry, basePlanId)
 *   3. Upserts the Supabase `subscriptions` table with verified data
 *      (overwrites the optimistic client-side write with ground truth)
 *   4. Returns verified state to the app
 *
 * Security:
 *   - The Google Play API call is the real verification — only Google can confirm
 *     a purchase_token is valid for your package
 *   - The obfuscatedAccountId in the Play response should match user_id
 *     (we set this at purchase time in purchaseSubscription())
 *   - Requires Supabase anon key in apikey header (standard Supabase function auth)
 *
 * Environment secrets (set via: supabase secrets set KEY=value):
 *   GOOGLE_SA_EMAIL              — service account client_email
 *   GOOGLE_SA_PRIVATE_KEY        — service account private_key (JSON escaped \n)
 *   ANDROID_PACKAGE_NAME         — your app's package name
 *   FIREBASE_PROJECT_ID          — Firebase / GCP project ID
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPlaySubscription, mapPlayStateToStatus } from '../_shared/play-api.ts';

// ─── Environment ──────────────────────────────────────────────────────────────
const PACKAGE_NAME = Deno.env.get('ANDROID_PACKAGE_NAME') ?? 'com.innovatexlabs.paisewaise';
const SA_EMAIL     = Deno.env.get('GOOGLE_SA_EMAIL') ?? '';
// Supabase stores secrets with literal \n — replace with real newlines for PEM parsing
const SA_KEY       = (Deno.env.get('GOOGLE_SA_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const SUPA_URL     = Deno.env.get('SUPABASE_URL') ?? '';
const SUPA_SRV_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ─── CORS headers (for Expo / React Native fetch calls) ──────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let body: { purchase_token?: string; product_id?: string; user_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { purchase_token, product_id, user_id } = body;
  if (!purchase_token || !product_id || !user_id) {
    return json(
      { error: 'Missing required fields: purchase_token, product_id, user_id' },
      400,
    );
  }

  // ── Guard: service account must be configured ──────────────────────────────
  if (!SA_EMAIL || !SA_KEY) {
    console.error('[verify-subscription] GOOGLE_SA_EMAIL or GOOGLE_SA_PRIVATE_KEY not set');
    return json({ error: 'Server configuration error — missing service account' }, 500);
  }

  console.log(
    `[verify-subscription] Verifying for user=${user_id} ` +
    `product=${product_id} token=${purchase_token.substring(0, 20)}...`,
  );

  // ── Step 1: Verify with Google Play API ────────────────────────────────────
  let playDetails;
  try {
    playDetails = await getPlaySubscription(PACKAGE_NAME, purchase_token, SA_EMAIL, SA_KEY);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[verify-subscription] Play API error:', msg);
    return json({ error: `Google Play verification failed: ${msg}` }, 502);
  }

  const status     = mapPlayStateToStatus(playDetails.subscriptionState);
  const basePlanId = playDetails.basePlanId ?? product_id;
  const expiryDate = playDetails.expiryTime ?? null;

  console.log(
    `[verify-subscription] Play result: state=${playDetails.subscriptionState} ` +
    `basePlan=${basePlanId} expiry=${expiryDate} status=${status}`,
  );

  // Optional: verify the obfuscatedAccountId matches user_id
  // (we set this in purchaseSubscription() as userId.substring(0, 64))
  if (
    playDetails.obfuscatedAccountId &&
    !user_id.startsWith(playDetails.obfuscatedAccountId.substring(0, 8))
  ) {
    console.warn(
      '[verify-subscription] obfuscatedAccountId mismatch — ' +
      `expected prefix: ${user_id.substring(0, 8)}, ` +
      `got: ${playDetails.obfuscatedAccountId.substring(0, 8)}`,
    );
    // Non-fatal: account IDs can diverge on plan switches; log and continue
  }

  // ── Step 2: Upsert Supabase subscriptions table ───────────────────────────
  const supabase = createClient(SUPA_URL, SUPA_SRV_KEY);

  const upsertData = {
    user_id,
    product_id,
    base_plan_id: basePlanId,
    purchase_token,
    status,
    purchase_date: playDetails.startTime ?? new Date().toISOString(),
    expiry_date:   expiryDate,
    updated_at:    new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(upsertData, { onConflict: 'purchase_token' });

  if (upsertError) {
    // Non-fatal: client already acknowledged and saved optimistically
    console.error('[verify-subscription] Supabase upsert error:', upsertError.message);
  } else {
    console.log('[verify-subscription] ✅ Supabase subscriptions upserted');
  }

  // ── Step 3: Return result to app ───────────────────────────────────────────
  return json({
    verified:      true,
    status,
    base_plan_id:  basePlanId,
    expiry_date:   expiryDate,
    auto_renew:    playDetails.autoRenewEnabled,
    play_state:    playDetails.subscriptionState,
  });
});
