/**
 * iap.web.ts — Web mock / fallback for Google Play Billing
 *
 * Web platform does not support Google Play Billing (react-native-iap / nitro modules).
 * This module provides identical type definitions and safe fallback stubs
 * so that Expo Web can bundle and run without runtime crashes.
 */

export const PRODUCT_ID = 'rupeo_premium_monthly';

export interface PlanConfig {
  id: 'monthly' | 'quarterly' | 'yearly';
  label: string;
  duration: string;
  months: number;
  fallbackPrice: string;
  fallbackPerMonth: string;
  savePct?: number;
  badge?: string;
  badgeVariant?: 'gold' | 'green' | 'purple';
}

export const PLANS: PlanConfig[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    duration: '1 Month',
    months: 1,
    fallbackPrice: '₹99',
    fallbackPerMonth: '₹99/mo',
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    duration: '3 Months',
    months: 3,
    fallbackPrice: '₹249',
    fallbackPerMonth: '₹83/mo',
    savePct: 16,
    badge: 'Save 16%',
    badgeVariant: 'gold',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    duration: '1 Year',
    months: 12,
    fallbackPrice: '₹799',
    fallbackPerMonth: '₹66/mo',
    savePct: 33,
    badge: 'Save 33% · Best Value',
    badgeVariant: 'green',
  },
];

export interface SubscriptionPlan {
  planId: 'monthly' | 'quarterly' | 'yearly';
  label: string;
  duration: string;
  months: number;
  price: string;
  perMonth: string;
  savePct?: number;
  badge?: string;
  badgeVariant?: 'gold' | 'green' | 'purple';
  offerToken: string;
}

export interface SubscriptionRecord {
  user_id: string;
  product_id: string;
  base_plan_id: string;
  purchase_token: string;
  status: string;
  purchase_date: any;
  expiry_date: string | null;
  previous_plan_id: string | null;
  created_at: any;
  updated_at: any;
}

export interface Purchase {
  id: string;
  productId: string;
  transactionDate: number;
  transactionReceipt?: string;
  purchaseToken?: string;
  currentPlanId?: string;
  [key: string]: any;
}

export interface PurchaseError {
  code: string;
  message: string;
}

export const ErrorCode = {
  UserCancelled: 'user-cancelled',
  BillingUnavailable: 'billing-unavailable',
  ItemAlreadyOwned: 'item-already-owned',
  PaymentPending: 'payment-pending',
  DeveloperError: 'developer-error',
} as const;

export async function initIAP(): Promise<boolean> {
  // Web does not support native Google Play Billing
  return false;
}

export async function destroyIAP(): Promise<void> {
  // No-op on web
}

export function setPurchaseCallbacks(
  _onSuccess: (purchase: Purchase) => void,
  _onError: (error: PurchaseError) => void,
): void {
  // No-op on web
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // Return fallback static plans on web
  return PLANS.map((p) => ({
    planId: p.id,
    label: p.label,
    duration: p.duration,
    months: p.months,
    price: p.fallbackPrice,
    perMonth: p.fallbackPerMonth,
    savePct: p.savePct,
    badge: p.badge,
    badgeVariant: p.badgeVariant,
    offerToken: '',
  }));
}

export async function purchaseSubscription(
  _plan: SubscriptionPlan,
  _userId: string,
  _existingPurchaseToken?: string,
): Promise<void> {
  throw new Error('Google Play In-App Purchases are only supported on Android devices. Please use the mobile app.');
}

export async function verifyAndActivatePurchase(
  _purchase: Purchase,
  _userId: string,
  _previousPlanId?: string,
): Promise<string> {
  return 'monthly';
}

export async function restorePurchases(_userId: string): Promise<Purchase | null> {
  return null;
}

export async function getActiveSubscription(_userId: string): Promise<{
  basePlanId: string;
  purchaseToken: string;
} | null> {
  return null;
}

export function isUserPremium(user: { isPremium?: boolean } | null | undefined): boolean {
  return Boolean(user?.isPremium);
}

export function getCurrentPlan(
  user: { isPremium?: boolean; premiumPlan?: string } | null | undefined,
): 'monthly' | 'quarterly' | 'yearly' | string | null {
  if (!user?.isPremium) return null;
  return user?.premiumPlan ?? null;
}

export function getPlanDisplayName(planId: string | null | undefined): string {
  if (!planId) return 'Free Plan';
  switch (planId.toLowerCase()) {
    case 'monthly':
      return 'Monthly Plan (₹99/mo)';
    case 'quarterly':
      return 'Quarterly Plan (₹83/mo)';
    case 'yearly':
      return 'Yearly Plan (₹66/mo · Best Value)';
    default:
      return `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;
  }
}
