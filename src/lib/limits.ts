/**
 * limits.ts — Free Tier vs Rupeo Pro Usage Limits
 *
 * Rules:
 *  - Free Users: Max 3 Bill & EMI Reminders
 *  - Free Users: Max 3 Multi-Page PDF Statement Exports/Shares
 *  - Rupeo Pro Users: Unlimited Reminders, Unlimited PDF Statements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_REMINDER_LIMIT = 3;
export const FREE_PDF_EXPORT_LIMIT = 3;

const PDF_EXPORT_KEY_PREFIX = 'rupeo_pdf_export_count_';

/**
 * Get the total number of PDF reports exported/shared by the user.
 */
export async function getPdfExportCount(userId?: string): Promise<number> {
  try {
    const key = `${PDF_EXPORT_KEY_PREFIX}${userId || 'guest'}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return 0;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
  } catch {
    return 0;
  }
}

/**
 * Increment the user's PDF export count by 1.
 */
export async function incrementPdfExportCount(userId?: string): Promise<number> {
  try {
    const current = await getPdfExportCount(userId);
    const updated = current + 1;
    const key = `${PDF_EXPORT_KEY_PREFIX}${userId || 'guest'}`;
    await AsyncStorage.setItem(key, String(updated));
    return updated;
  } catch {
    return 1;
  }
}

/**
 * Check if the user is allowed to export/share a PDF statement.
 * If user is Premium OR admin has turned off Pro/Subscriptions remotely, feature is fully unlocked.
 */
export async function checkPdfExportLimit(
  isPremium: boolean,
  userId?: string,
  isProDisabledByAdmin: boolean = false
): Promise<{ allowed: boolean; count: number; remaining: number }> {
  if (isPremium || isProDisabledByAdmin) {
    return { allowed: true, count: 0, remaining: Infinity };
  }
  const count = await getPdfExportCount(userId);
  const allowed = count < FREE_PDF_EXPORT_LIMIT;
  const remaining = Math.max(0, FREE_PDF_EXPORT_LIMIT - count);
  return { allowed, count, remaining };
}

/**
 * Check if the user is allowed to add a new reminder.
 * If user is Premium OR admin has turned off Pro/Subscriptions remotely, feature is fully unlocked.
 */
export function checkReminderLimit(
  isPremium: boolean,
  currentCount: number,
  isProDisabledByAdmin: boolean = false
): { allowed: boolean; count: number; remaining: number } {
  if (isPremium || isProDisabledByAdmin) {
    return { allowed: true, count: currentCount, remaining: Infinity };
  }
  const allowed = currentCount < FREE_REMINDER_LIMIT;
  const remaining = Math.max(0, FREE_REMINDER_LIMIT - currentCount);
  return { allowed, count: currentCount, remaining };
}
