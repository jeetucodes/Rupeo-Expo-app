/**
 * play-api.ts — Google Play Developer API v3 client
 *
 * Calls purchases.subscriptionsv2.get to verify a subscription purchase token.
 * The v2 API returns a richer response than v1 including lineItems, 
 * basePlanId per item, and acknowledgementState.
 *
 * API reference:
 * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get
 */

import { getGoogleAccessToken } from './google-auth.ts';

const PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const PLAY_BASE  = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaySubscriptionDetails {
  /** e.g. 'SUBSCRIPTION_STATE_ACTIVE' */
  subscriptionState: string;
  /** Base plan ID from lineItems (e.g. 'monthly', 'quarterly', 'yearly') */
  basePlanId: string | null;
  /** Promotional offer ID if user is on a free trial / intro offer */
  offerId: string | null;
  /** ISO 8601 — when the current billing period ends */
  expiryTime: string | null;
  /** ISO 8601 — when the subscription started */
  startTime: string | null;
  autoRenewEnabled: boolean;
  /** 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' | 'ACKNOWLEDGEMENT_STATE_PENDING' */
  acknowledgementState: string;
  /** Firebase UID we passed as obfuscatedAccountId at purchase time */
  obfuscatedAccountId: string | null;
  /** True when payment is in arrears (grace period / on hold) */
  paymentPending: boolean;
}

interface PlayApiResponse {
  subscriptionState?: string;
  lineItems?: Array<{
    productId?: string;
    offerDetails?: {
      basePlanId?: string;
      offerId?: string;
      offerTags?: string[];
    };
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
    prepaidPlan?: { allowExtendAfterTime?: string };
  }>;
  startTime?: string;
  acknowledgementState?: string;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  pausedStateContext?: { autoResumeTime?: string };
}

// ─── Main API call ────────────────────────────────────────────────────────────

/**
 * Fetch subscription details from Google Play subscriptionsv2 API.
 *
 * @param packageName   Android package name
 * @param purchaseToken Token from the in-app purchase
 * @param saEmail       Service account client_email
 * @param privateKey    Service account private_key (PEM)
 */
export async function getPlaySubscription(
  packageName: string,
  purchaseToken: string,
  saEmail: string,
  privateKey: string,
): Promise<PlaySubscriptionDetails> {
  const accessToken = await getGoogleAccessToken(saEmail, privateKey, PLAY_SCOPE);

  const url =
    `${PLAY_BASE}/${encodeURIComponent(packageName)}` +
    `/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `[play-api] subscriptionsv2.get failed — HTTP ${res.status}: ${body}`,
    );
  }

  const data = (await res.json()) as PlayApiResponse;

  // Google returns multiple lineItems for multi-subscription orders.
  // For Rupeo we have a single-product subscription — take the first item.
  const item = data.lineItems?.[0];

  return {
    subscriptionState: data.subscriptionState ?? 'SUBSCRIPTION_STATE_UNSPECIFIED',
    basePlanId:        item?.offerDetails?.basePlanId ?? null,
    offerId:           item?.offerDetails?.offerId ?? null,
    expiryTime:        item?.expiryTime ?? null,
    startTime:         data.startTime ?? null,
    autoRenewEnabled:  item?.autoRenewingPlan?.autoRenewEnabled ?? false,
    acknowledgementState: data.acknowledgementState ?? 'ACKNOWLEDGEMENT_STATE_UNSPECIFIED',
    obfuscatedAccountId:
      data.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
    paymentPending:
      data.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
      data.subscriptionState === 'SUBSCRIPTION_STATE_ON_HOLD',
  };
}

// ─── Status mapping ───────────────────────────────────────────────────────────

/** Map Google Play subscriptionState → our Supabase status column value */
export function mapPlayStateToStatus(playState: string): string {
  const stateMap: Record<string, string> = {
    SUBSCRIPTION_STATE_ACTIVE:           'active',
    SUBSCRIPTION_STATE_CANCELED:         'cancelled',
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD:  'grace_period',
    SUBSCRIPTION_STATE_ON_HOLD:          'on_hold',
    SUBSCRIPTION_STATE_PAUSED:           'paused',
    SUBSCRIPTION_STATE_EXPIRED:          'expired',
    // PENDING = just purchased, not yet confirmed by Google — treat optimistically
    SUBSCRIPTION_STATE_PENDING:          'active',
    SUBSCRIPTION_STATE_UNSPECIFIED:      'active',
  };
  return stateMap[playState] ?? 'expired';
}
