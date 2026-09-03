import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { formatTime12Hour, getLocalDateString, getLocalMonthString } from './dateUtils';

export interface CategoryItem {
  id?: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export const defaultCategories: CategoryItem[] = [
  { name: 'Food', icon: 'fast-food', color: '#FF6B6B' },
  { name: 'Groceries', icon: 'cart', color: '#10B981' },
  { name: 'Dining', icon: 'restaurant', color: '#EF4444' },
  { name: 'Coffee', icon: 'cafe', color: '#7C3AED' },
  { name: 'Travel', icon: 'airplane', color: '#4D96FF' },
  { name: 'Fuel', icon: 'water', color: '#F59E0B' },
  { name: 'Shopping', icon: 'bag', color: '#9D4EDD' },
  { name: 'Rent', icon: 'home', color: '#6BCB77' },
  { name: 'Bills', icon: 'receipt', color: '#FF9F1C' },
  { name: 'Utilities', icon: 'bulb', color: '#3B82F6' },
  { name: 'EMI', icon: 'card', color: '#E63946' },
  { name: 'Entertainment', icon: 'film', color: '#FFD166' },
  { name: 'Subscriptions', icon: 'play-circle', color: '#118AB2' },
  { name: 'Healthcare', icon: 'medkit', color: '#06D6A0' },
  { name: 'Education', icon: 'school', color: '#073B4C' },
  { name: 'Fitness', icon: 'barbell', color: '#F97316' },
  { name: 'Savings', icon: 'cash', color: '#10B981' },
  { name: 'Pocket Money', icon: 'wallet', color: '#EC4899' },
  { name: 'Friend', icon: 'people', color: '#8B5CF6' },
  { name: 'Job', icon: 'briefcase', color: '#14B8A6' },
  { name: 'Others', icon: 'list', color: '#8D99AE' },
];

export async function initDatabase() {
  // No-op for Firestore
}

// Helper to normalize date to YYYY-MM-DD
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return getLocalDateString();

  const trimmed = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch;
    if (y.length === 2) y = `20${y}`;
    const month = parseInt(m);
    if (month > 12) {
      return `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`;
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MMM-YYYY or DD MMM YYYY
  const dMMyMatch = trimmed.match(/^(\d{1,2})[\s-]([a-zA-Z]{3})[\s-](\d{2,4})$/);
  if (dMMyMatch) {
    let [, d, mStr, y] = dMMyMatch;
    if (y.length === 2) y = `20${y}`;
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const m = months[mStr.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, '0')}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return getLocalDateString(parsed);
  }

  return getLocalDateString();
}

export async function insertTransaction(userId: string, tx: any, statementId?: number) {
  if (!userId) return null;
  const txsRef = collection(db, `users/${userId}/transactions`);
  const docRef = await addDoc(txsRef, {
    date: normalizeDate(tx.date),
    time: tx.time || null,
    amount: Number(tx.amount) || 0,
    type: (tx.type || 'debit').toLowerCase(),
    merchant_name: tx.merchant_name || null,
    category: tx.category || 'Others',
    description: tx.description || null,
    utr: tx.utr || null,
    ref_no: tx.ref_no || null,
    payment_mode: tx.payment_mode || 'Cash',
    receipt_image: tx.receipt_image || tx.receiptImage || null,
    balance_after: tx.balance_after ? Number(tx.balance_after) : null,
    source: tx.source || 'manual',
    source_statement_id: statementId || null,
    is_manually_edited: tx.is_manually_edited ? 1 : 0,
    created_at: serverTimestamp(),
  });

  if ((tx.type || 'debit').toLowerCase() === 'debit') {
    checkAndTriggerBudgetAlert(userId).catch(() => {});
  }

  return docRef.id;
}

export async function updateTransaction(userId: string, txId: string, txData: any) {
  if (!userId || !txId) return;
  const docRef = doc(db, `users/${userId}/transactions`, txId);
  const dataToUpdate: Record<string, any> = {
    is_manually_edited: 1,
    updated_at: serverTimestamp(),
  };

  if (txData.date !== undefined) dataToUpdate.date = normalizeDate(txData.date);
  if (txData.time !== undefined) dataToUpdate.time = txData.time;
  if (txData.amount !== undefined) dataToUpdate.amount = Number(txData.amount) || 0;
  if (txData.type !== undefined) dataToUpdate.type = (txData.type || 'debit').toLowerCase();
  if (txData.merchant_name !== undefined) dataToUpdate.merchant_name = txData.merchant_name;
  if (txData.category !== undefined) dataToUpdate.category = txData.category;
  if (txData.description !== undefined) dataToUpdate.description = txData.description;
  if (txData.payment_mode !== undefined) dataToUpdate.payment_mode = txData.payment_mode;
  if (txData.receipt_image !== undefined) dataToUpdate.receipt_image = txData.receipt_image;
  if (txData.utr !== undefined) dataToUpdate.utr = txData.utr;
  if (txData.ref_no !== undefined) dataToUpdate.ref_no = txData.ref_no;

  await updateDoc(docRef, dataToUpdate);
}

export async function getTransactionById(userId: string, txId: string): Promise<any | null> {
  if (!userId || !txId) return null;
  const docRef = doc(db, `users/${userId}/transactions`, txId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export async function insertTransactionsBatch(
  userId: string,
  transactions: any[],
  statementId?: number
): Promise<{ imported: number; skipped: number }> {
  if (!userId) return { imported: 0, skipped: 0 };
  let imported = 0;
  let skipped = 0;

  const existingTxs = await getAllTransactions(userId);
  const MAX_BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const tx of transactions) {
    const normDate = normalizeDate(tx.date);
    const amount = Number(tx.amount) || 0;
    const ref = tx.ref_no || tx.utr;

    const isDuplicate = existingTxs.some((e: any) => {
      if (e.date !== normDate || e.amount !== amount) return false;
      if (ref && (e.ref_no === ref || e.utr === ref)) return true;
      if (!ref && e.description === tx.description) return true;
      return false;
    });

    if (isDuplicate) {
      skipped++;
      continue;
    }

    const txsRef = doc(collection(db, `users/${userId}/transactions`));
    batch.set(txsRef, {
      date: normDate,
      time: tx.time || null,
      amount,
      type: (tx.type || 'debit').toLowerCase(),
      merchant_name: tx.merchant_name || null,
      category: tx.category || 'Others',
      description: tx.description || null,
      utr: tx.utr || null,
      ref_no: tx.ref_no || null,
      payment_mode: tx.payment_mode || 'Cash',
      receipt_image: tx.receipt_image || null,
      balance_after: tx.balance_after ? Number(tx.balance_after) : null,
      source: tx.source || 'statement',
      source_statement_id: statementId || null,
      is_manually_edited: 0,
      created_at: serverTimestamp(),
    });

    batchCount++;
    imported++;

    if (batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { imported, skipped };
}

export async function getAllTransactions(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, `users/${userId}/transactions`), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Fallback getting transactions without order:', err);
    const snapshot = await getDocs(collection(db, `users/${userId}/transactions`));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
  }
}

export async function getTransactionsByMonth(userId: string, monthYear: string): Promise<any[]> {
  if (!userId) return [];
  const txs = await getAllTransactions(userId);
  return txs.filter((tx: any) => tx.date && tx.date.startsWith(monthYear));
}

export async function deleteTransaction(userId: string, txId: string) {
  if (!userId || !txId) return;
  await deleteDoc(doc(db, `users/${userId}/transactions`, txId));
}

export async function deleteAllTransactions(userId: string) {
  if (!userId) return;
  const txs = await getAllTransactions(userId);
  const MAX_BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const tx of txs) {
    batch.delete(doc(db, `users/${userId}/transactions`, tx.id));
    batchCount++;
    if (batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
  }
}

// ==================== CATEGORIES ====================

export async function getUserCategories(userId: string): Promise<CategoryItem[]> {
  if (!userId) return defaultCategories;
  try {
    const categoriesRef = collection(db, `users/${userId}/categories`);
    const snapshot = await getDocs(categoriesRef);
    if (snapshot.empty) {
      return defaultCategories;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryItem));
  } catch (err) {
    console.warn('Could not load categories; using defaults:', err);
    return defaultCategories;
  }
}

export async function addCategory(userId: string, category: CategoryItem) {
  if (!userId) return;
  const categoriesRef = collection(db, `users/${userId}/categories`);
  const docRef = await addDoc(categoriesRef, {
    ...category,
    isCustom: true,
  });
  return docRef.id;
}

export async function deleteCategory(userId: string, categoryId: string) {
  if (!userId || !categoryId) return;
  const docRef = doc(db, `users/${userId}/categories`, categoryId);
  await deleteDoc(docRef);
}

export async function addCustomCategory(userId: string, category: CategoryItem) {
  return addCategory(userId, category);
}

export async function updateCustomCategory(userId: string, categoryId: string, category: Partial<CategoryItem>) {
  if (!userId || !categoryId) return;
  const docRef = doc(db, `users/${userId}/categories`, categoryId);
  await updateDoc(docRef, category);
}

export async function deleteCustomCategory(userId: string, categoryId: string) {
  return deleteCategory(userId, categoryId);
}

export async function getCategoryTotals(
  userId: string,
  monthYear?: string
): Promise<{ name: string; amount: number; color: string; icon: string }[]> {
  if (!userId) return [];
  const [txs, allCategories] = await Promise.all([
    getAllTransactions(userId),
    getUserCategories(userId),
  ]);

  const filteredTxs = monthYear
    ? txs.filter((tx: any) => tx.date && tx.date.startsWith(monthYear) && tx.type === 'debit')
    : txs.filter((tx: any) => tx.type === 'debit');

  const catMap: Record<string, number> = {};
  for (const tx of filteredTxs) {
    const cat = tx.category || 'Others';
    const amt = Number(tx.amount) || 0;
    catMap[cat] = (catMap[cat] || 0) + amt;
  }

  return allCategories.map(cat => ({
    name: cat.name,
    amount: catMap[cat.name] || 0,
    color: cat.color,
    icon: cat.icon,
  }));
}

// ==================== RECURRING BILLS & REMINDERS ====================

export interface RecurringBill {
  id?: string;
  title: string;          // e.g. "Flat Rent", "Jio Recharge", "Airtel Fiber", "Electricity"
  amount: number;         // e.g. 8000
  category: string;       // e.g. "Rent", "Subscriptions", "Bills"
  type: 'monthly_date' | 'cycle_days'; // 'monthly_date' for monthly day (e.g. 30th) or 'cycle_days' (e.g. 28 days)
  provider?: string;      // e.g. 'jio', 'airtel', 'vi', 'bsnl', 'netflix', 'spotify', 'prime', 'rent'
  brandColor?: string;    // e.g. '#0A2885', '#ED1C24', '#E50914'
  brandBadge?: string;    // e.g. 'Jio', 'airtel', 'Vi', 'BSNL'
  dueDay?: number;        // 1 to 31 (e.g. 30 for 30th of every month)
  cycleDays?: number;     // e.g. 28, 56, 84, 365
  startDate?: string;     // YYYY-MM-DD
  lastPaidDate?: string;  // YYYY-MM-DD
  nextDueDate: string;    // YYYY-MM-DD
  notes?: string;
  autoReminderDays?: number; // default 3 days
  reminderEnabled?: boolean;
  receiptImage?: string;  // Last payment proof screenshot
  status?: 'due_soon' | 'due_today' | 'overdue' | 'paid';
  created_at?: any;
}

export function calculateNextMonthlyDueDate(dueDay: number, baseDate = new Date()): string {
  const today = new Date(baseDate);
  let targetYear = today.getFullYear();
  let targetMonth = today.getMonth(); // 0-indexed

  if (today.getDate() > dueDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(dueDay, maxDaysInMonth);
  const mStr = String(targetMonth + 1).padStart(2, '0');
  const dStr = String(actualDay).padStart(2, '0');
  return `${targetYear}-${mStr}-${dStr}`;
}

export function calculateNextCycleDueDate(cycleDays: number, baseDateStr?: string): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(base.getTime())) return getLocalDateString();
  const next = new Date(base.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  return getLocalDateString(next);
}

export async function getRecurringBills(userId: string): Promise<RecurringBill[]> {
  if (!userId) return [];
  try {
    const billsRef = collection(db, `users/${userId}/recurring_bills`);
    const snap = await getDocs(billsRef);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringBill));
    return list.sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));
  } catch (err) {
    console.warn('Error fetching recurring bills:', err);
    return [];
  }
}

export async function saveRecurringBill(userId: string, bill: RecurringBill): Promise<string> {
  if (!userId) throw new Error('User not logged in');
  const billsRef = collection(db, `users/${userId}/recurring_bills`);

  let nextDue = bill.nextDueDate;
  if (!nextDue) {
    if (bill.type === 'monthly_date' && bill.dueDay) {
      nextDue = calculateNextMonthlyDueDate(bill.dueDay);
    } else if (bill.type === 'cycle_days' && bill.cycleDays) {
      nextDue = calculateNextCycleDueDate(bill.cycleDays, bill.startDate || bill.lastPaidDate);
    } else {
      nextDue = getLocalDateString();
    }
  }

  const payload = {
    title: bill.title.trim(),
    amount: Number(bill.amount) || 0,
    category: bill.category || 'Bills',
    type: bill.type || 'monthly_date',
    provider: bill.provider || null,
    brandColor: bill.brandColor || null,
    brandBadge: bill.brandBadge || null,
    dueDay: bill.dueDay ? Number(bill.dueDay) : null,
    cycleDays: bill.cycleDays ? Number(bill.cycleDays) : null,
    startDate: bill.startDate || getLocalDateString(),
    lastPaidDate: bill.lastPaidDate || null,
    nextDueDate: nextDue,
    notes: bill.notes?.trim() || null,
    autoReminderDays: bill.autoReminderDays ?? 3,
    receiptImage: bill.receiptImage || null,
    created_at: serverTimestamp(),
  };

  if (bill.id) {
    const docRef = doc(db, `users/${userId}/recurring_bills`, bill.id);
    await updateDoc(docRef, payload);
    return bill.id;
  } else {
    const docRef = await addDoc(billsRef, payload);
    return docRef.id;
  }
}

export async function deleteRecurringBill(userId: string, billId: string) {
  if (!userId || !billId) return;
  await deleteDoc(doc(db, `users/${userId}/recurring_bills`, billId));
}

export async function payRecurringBill(
  userId: string,
  bill: RecurringBill,
  paymentMode = 'UPI',
  receiptImage?: string
) {
  if (!userId || !bill.id) return;
  const todayStr = getLocalDateString();
  const now = new Date();
  const timeStr = formatTime12Hour(now);

  // 1. Record the expense transaction with attached proof screenshot
  await insertTransaction(userId, {
    date: todayStr,
    time: timeStr,
    amount: bill.amount,
    type: 'debit',
    merchant_name: bill.title,
    category: bill.category || 'Bills',
    description: bill.notes ? `${bill.notes} (Bill Payment)` : `Recurring Payment: ${bill.title}`,
    payment_mode: paymentMode,
    receipt_image: receiptImage || bill.receiptImage || null,
  });

  // 2. Calculate next due date
  let nextDate = todayStr;
  if (bill.type === 'monthly_date' && bill.dueDay) {
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    nextDate = calculateNextMonthlyDueDate(bill.dueDay, nextMonthDate);
  } else if (bill.type === 'cycle_days' && bill.cycleDays) {
    nextDate = calculateNextCycleDueDate(bill.cycleDays, todayStr);
  }

  // 3. Update the recurring bill doc in Firestore for NEXT cycle (reset proof for next cycle)
  const billDocRef = doc(db, `users/${userId}/recurring_bills`, bill.id);
  await updateDoc(billDocRef, {
    lastPaidDate: todayStr,
    nextDueDate: nextDate,
    status: 'paid',
    receiptImage: null, // Clean slate for the next renewal cycle so fresh proof is asked next time
    lastReceiptImage: receiptImage || null,
    updated_at: serverTimestamp(),
  });

  // 4. Create in-app success notification
  await createNotification(userId, {
    title: `Payment Recorded: ${bill.title} ✅`,
    message: `Payment of ₹${bill.amount.toLocaleString('en-IN')} marked as paid. Next due date is ${nextDate}.`,
    type: 'reminder',
  });
}

export async function checkBillReminders(userId: string) {
  if (!userId) return;
  try {
    const bills = await getRecurringBills(userId);
    const todayStr = getLocalDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const bill of bills) {
      if (!bill.nextDueDate) continue;
      const dueDate = new Date(bill.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffMs = dueDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const reminderThreshold = bill.autoReminderDays || 3;

      if (diffDays >= 0 && diffDays <= reminderThreshold) {
        let title = '';
        let message = '';
        if (diffDays === 0) {
          title = `🚨 Due Today: ${bill.title}`;
          message = `Your ${bill.title} of ₹${bill.amount.toLocaleString('en-IN')} is due TODAY!`;
        } else {
          title = `⏰ Reminder: ${bill.title} due in ${diffDays} days`;
          message = `Your ${bill.title} of ₹${bill.amount.toLocaleString('en-IN')} is due on ${bill.nextDueDate} (${diffDays} days left).`;
        }

        const now = new Date();
        const currentHour = now.getHours();
        let currentPeriod = 'evening';
        if (currentHour >= 5 && currentHour < 12) currentPeriod = 'morning';
        else if (currentHour >= 12 && currentHour < 17) currentPeriod = 'afternoon';

        const notifs = await getUserNotifications(userId).catch(() => []);
        const alreadyNotifiedThisPeriod = notifs.some(n => {
          if (n.title !== title || !n.createdAt) return false;
          const notifDate = new Date(n.createdAt);
          const notifHour = notifDate.getHours();
          let notifPeriod = 'evening';
          if (notifHour >= 5 && notifHour < 12) notifPeriod = 'morning';
          else if (notifHour >= 12 && notifHour < 17) notifPeriod = 'afternoon';
          
          return (
            notifDate.getFullYear() === now.getFullYear() &&
            notifDate.getMonth() === now.getMonth() &&
            notifDate.getDate() === now.getDate() &&
            notifPeriod === currentPeriod
          );
        });

        if (!alreadyNotifiedThisPeriod) {
          await createNotification(userId, {
            title,
            message,
            type: 'reminder',
            silentPush: true,
          });

          // Trigger OS local push notification
          try {
            const { sendLocalPushNotification } = await import('@/lib/notifications');
            await sendLocalPushNotification(title, message, 'reminders', {
              type: 'bill_reminder',
              billId: bill.id,
            });
          } catch (notifErr) {
            console.warn('Could not fire local push for bill reminder:', notifErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('checkBillReminders error:', err);
  }
}

// ==================== BUDGET & GOALS ====================

export interface CategoryBudget {
  category: string;
  amount: number;
}

export async function getCategoryBudgets(userId: string): Promise<Record<string, number>> {
  if (!userId) return {};
  try {
    const snap = await getDocs(collection(db, `users/${userId}/category_budgets`));
    const budgetMap: Record<string, number> = {};
    snap.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        budgetMap[data.category] = Number(data.amount) || 0;
      }
    });
    return budgetMap;
  } catch (err) {
    console.warn('Error fetching category budgets:', err);
    return {};
  }
}

export async function saveCategoryBudget(userId: string, category: string, amount: number) {
  if (!userId || !category) return;
  const docRef = doc(db, `users/${userId}/category_budgets`, category);
  await setDoc(docRef, {
    category,
    amount: Number(amount) || 0,
    updated_at: serverTimestamp(),
  }, { merge: true });
}

export async function deleteCategoryBudget(userId: string, category: string) {
  if (!userId || !category) return;
  const docRef = doc(db, `users/${userId}/category_budgets`, category);
  await deleteDoc(docRef);
}

// ==================== NOTIFICATIONS ====================

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'tip' | 'reminder' | 'system';
  isRead: boolean;
  createdAt: string;
  source?: string;
}

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function mapNotification(id: string, data: Record<string, any>, fallback?: Record<string, any>): AppNotification {
  const source = { ...data, ...fallback };
  return {
    id,
    title: source.title || '',
    message: source.message || '',
    type: source.type || 'system',
    isRead: !!data.isRead,
    createdAt: timestampToIso(source.createdAt || source.created_at),
    source: source.source,
  };
}

async function loadUserNotifications(userId: string): Promise<AppNotification[]> {
  const historySnapshot = await getDocs(collection(db, `users/${userId}/notifications`));
  const history = new Map(historySnapshot.docs.map(item => [item.id, item.data()]));

  const activeAdminSnapshot = await getDocs(
    query(collection(db, 'admin_notifications'), where('active', '==', true))
  );
  const adminNotifications = activeAdminSnapshot.docs.map(item => {
    const adminData = item.data();
    return mapNotification(item.id, history.get(item.id) || {}, adminData);
  });

  const localNotifications = historySnapshot.docs
    .filter(item => item.data().source !== 'admin_notification')
    .map(item => mapNotification(item.id, item.data()));

  return [...adminNotifications, ...localNotifications].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId) return [];
  try {
    return await loadUserNotifications(userId);
  } catch (err) {
    console.warn('Error fetching notifications:', err);
    return [];
  }
}

export function subscribeToUserNotifications(
  userId: string,
  onChange: (notifications: AppNotification[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) return () => {};

  let history: AppNotification[] = [];
  let admin: AppNotification[] = [];
  let historyError: Error | null = null;
  let adminError: Error | null = null;

  const emit = () => {
    if (historyError || adminError) {
      onError(historyError || adminError || new Error('Unable to load notifications'));
      return;
    }
    const historyById = new Map(history.map(item => [item.id, item]));
    const merged = admin.map(item => ({ ...item, isRead: historyById.get(item.id)?.isRead || false }));
    const local = history.filter(item => item.source !== 'admin_notification');
    onChange([...merged, ...local].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ));
  };

  const unsubscribeHistory = onSnapshot(
    collection(db, `users/${userId}/notifications`),
    snapshot => {
      historyError = null;
      history = snapshot.docs.map(item => mapNotification(item.id, item.data()));
      emit();
    },
    error => { historyError = error; emit(); }
  );
  const unsubscribeAdmin = onSnapshot(
    query(collection(db, 'admin_notifications'), where('active', '==', true)),
    snapshot => {
      adminError = null;
      admin = snapshot.docs.map(item => mapNotification(item.id, item.data()));
      emit();
    },
    error => { adminError = error; emit(); }
  );

  return () => {
    unsubscribeHistory();
    unsubscribeAdmin();
  };
}

export async function createNotification(
  userId: string,
  notification: { title: string; message: string; type?: 'budget' | 'tip' | 'reminder' | 'system'; silentPush?: boolean }
) {
  if (!userId) return;
  const colRef = collection(db, `users/${userId}/notifications`);
  const docRef = await addDoc(colRef, {
    title: notification.title,
    message: notification.message,
    type: notification.type || 'system',
    isRead: false,
    silentPush: notification.silentPush || false,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (!userId || !notificationId) return;
  try {
    const docRef = doc(db, `users/${userId}/notifications`, notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.warn('Error marking notification as read:', err);
  }
}

export async function markNotificationsAsRead(userId: string) {
  if (!userId) return;
  try {
    const snap = await getDocs(collection(db, `users/${userId}/notifications`));
    const batch = writeBatch(db);
    snap.forEach(d => {
      batch.update(doc(db, `users/${userId}/notifications`, d.id), { isRead: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Error marking notifications as read:', err);
  }
}

export async function deleteNotification(userId: string, notificationId: string) {
  if (!userId || !notificationId) return;
  try {
    await deleteDoc(doc(db, `users/${userId}/notifications`, notificationId));
  } catch (err) {
    console.warn('Error deleting notification:', err);
  }
}

export async function deleteAllNotifications(userId: string) {
  if (!userId) return;
  try {
    const snap = await getDocs(collection(db, `users/${userId}/notifications`));
    const batch = writeBatch(db);
    snap.forEach(d => {
      batch.delete(doc(db, `users/${userId}/notifications`, d.id));
    });
    await batch.commit();
  } catch (err) {
    console.warn('Error deleting all notifications:', err);
  }
}

export async function checkAndTriggerBudgetAlert(userId: string) {
  if (!userId) return;
  try {
    const [settings, txs] = await Promise.all([
      getUserSettings(userId),
      getAllTransactions(userId),
    ]);

    const budget = settings?.monthlyBudget || 0;
    if (budget <= 0) return;

    const currMonth = getLocalMonthString();
    const monthSpend = txs
      .filter(t => t.type === 'debit' && t.date?.startsWith(currMonth))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const curr = settings?.currency === 'INR' ? '₹' : (settings?.currency || '₹');

    // Check if 100% budget reached
    if (monthSpend >= budget) {
      await createNotification(userId, {
        title: 'Monthly Budget Exceeded 🚨',
        message: `You have spent ${curr}${monthSpend.toLocaleString('en-IN')}, which exceeds your monthly budget of ${curr}${budget.toLocaleString('en-IN')}.`,
        type: 'budget',
      });
    } else if (monthSpend >= budget * 0.8) {
      await createNotification(userId, {
        title: 'Budget Alert (80% Reached) ⚠️',
        message: `You have used 80% of your monthly budget (${curr}${monthSpend.toLocaleString('en-IN')} / ${curr}${budget.toLocaleString('en-IN')}).`,
        type: 'budget',
      });
    }
  } catch (err) {
    console.warn('checkAndTriggerBudgetAlert error:', err);
  }
}

// ==================== MERCHANT RULES ====================

export async function getMerchantRules(userId: string): Promise<Record<string, string>> {
  if (!userId) return {};
  const rulesRef = collection(db, `users/${userId}/merchant_rules`);
  const snapshot = await getDocs(rulesRef);
  const ruleMap: Record<string, string> = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    ruleMap[data.merchant_keyword.toLowerCase()] = data.assigned_category;
  });
  return ruleMap;
}

export async function getMerchantRule(userId: string, keyword: string): Promise<string | null> {
  const rules = await getMerchantRules(userId);
  return rules[keyword.toLowerCase().trim()] || null;
}

export async function saveMerchantRule(
  userId: string,
  merchant_keyword: string,
  assigned_category: string
) {
  if (!userId || !merchant_keyword) return;
  const keyword = merchant_keyword.toLowerCase().trim();

  const rulesRef = collection(db, `users/${userId}/merchant_rules`);
  const q = query(rulesRef, where('merchant_keyword', '==', keyword));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await setDoc(doc(db, `users/${userId}/merchant_rules`, docId), { assigned_category }, { merge: true });
  } else {
    await addDoc(rulesRef, {
      merchant_keyword: keyword,
      assigned_category: assigned_category,
    });
  }
}

// ==================== USER SETTINGS ====================

export interface UserSettings {
  language: string; // 'English' | 'Hindi' | 'Hinglish'
  currency: string; // '$' | '₹'
  aiLanguage?: string; // 'Hinglish' | 'Hindi' | 'English'
  monthlyBudget?: number;
  isPremium?: boolean;
  premiumPlan?: 'monthly' | '3_months' | '6_months' | 'yearly' | 'lifetime' | string;
  premiumActivatedAt?: string;
}

export interface StartingBalanceProfile {
  startingBalance: number;
  hasSetStartingBalance: boolean;
}

export async function getStartingBalanceProfile(userId: string): Promise<StartingBalanceProfile> {
  if (!userId) return { startingBalance: 0, hasSetStartingBalance: true };
  const snapshot = await getDoc(doc(db, 'users', userId));
  if (!snapshot.exists()) return { startingBalance: 0, hasSetStartingBalance: true };

  const data = snapshot.data();
  return {
    startingBalance: Number(data.starting_balance) || 0,
    // Profiles created before this feature are considered already onboarded.
    hasSetStartingBalance: data.has_set_starting_balance !== false,
  };
}

export async function saveStartingBalance(userId: string, startingBalance: number) {
  if (!userId) return;
  await setDoc(doc(db, 'users', userId), {
    starting_balance: Number.isFinite(startingBalance) ? startingBalance : 0,
    has_set_starting_balance: true,
  }, { merge: true });
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, `users/${userId}/settings/preferences`);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserSettings;
      if (data.currency === 'INR') {
        data.currency = '₹';
      }
      return data;
    }

    // Check legacy settings on user document root if any
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      if (userData?.settings && (userData.settings.language || userData.settings.currency)) {
        const legacySettings: UserSettings = {
          language: userData.settings.language || 'English',
          currency: userData.settings.currency === 'INR' ? '₹' : (userData.settings.currency || '₹'),
          monthlyBudget: userData.settings.monthlyBudget,
          isPremium: userData.is_premium || userData.settings.isPremium || false,
          premiumPlan: userData.premium_plan || userData.settings.premiumPlan,
        };
        setDoc(docRef, legacySettings, { merge: true }).catch(() => {});
        return legacySettings;
      }
    }
  } catch (err) {
    console.warn('Could not load user settings; using defaults:', err);
  }

  return null;
}

export async function saveUserSettings(userId: string, settings: UserSettings) {
  if (!userId) return;
  const normalized: UserSettings = {
    language: settings.language || 'English',
    currency: settings.currency === 'INR' ? '₹' : (settings.currency || '₹'),
    ...(settings.aiLanguage ? { aiLanguage: settings.aiLanguage } : {}),
    ...(settings.monthlyBudget !== undefined ? { monthlyBudget: settings.monthlyBudget } : {}),
    ...(settings.isPremium !== undefined ? { isPremium: settings.isPremium } : {}),
    ...(settings.premiumPlan ? { premiumPlan: settings.premiumPlan } : {}),
    ...(settings.premiumActivatedAt ? { premiumActivatedAt: settings.premiumActivatedAt } : {}),
  };
  const docRef = doc(db, `users/${userId}/settings/preferences`);
  await setDoc(docRef, normalized, { merge: true });
}

export async function setPremiumStatus(
  userId: string,
  isPremium: boolean,
  plan: string = 'lifetime'
) {
  if (!userId) return;
  const now = new Date().toISOString();
  const docRef = doc(db, `users/${userId}/settings/preferences`);
  await setDoc(
    docRef,
    {
      isPremium,
      premiumPlan: plan,
      premiumActivatedAt: now,
    },
    { merge: true }
  );

  // Also update user doc root for easy indexing
  await setDoc(
    doc(db, 'users', userId),
    {
      is_premium: isPremium,
      premium_plan: plan,
      premium_activated_at: now,
    },
    { merge: true }
  );
}

export async function recordPremiumPayment(
  userId: string,
  paymentData: {
    plan: string;
    amount: number;
    utr?: string;
    paymentMode: string;
    couponCode?: string;
    discount?: number;
    userEmail?: string;
    userName?: string;
  }
) {
  if (!userId) return null;
  const now = new Date().toISOString();

  // Clean data so Firestore never receives undefined properties
  const cleanData: Record<string, any> = {
    plan: paymentData.plan || 'monthly',
    amount: typeof paymentData.amount === 'number' ? paymentData.amount : 0,
    paymentMode: paymentData.paymentMode || 'Razorpay',
    discount: typeof paymentData.discount === 'number' ? paymentData.discount : 0,
    userEmail: paymentData.userEmail || 'unknown',
    userName: paymentData.userName || 'Rupeo User',
    status: 'success',
    timestamp: now,
    created_at: serverTimestamp(),
  };

  if (paymentData.utr) {
    cleanData.utr = paymentData.utr;
  }
  if (paymentData.couponCode) {
    cleanData.couponCode = paymentData.couponCode;
  }

  // 1. Save payment record in user's subcollection
  const userPayRef = collection(db, `users/${userId}/premium_payments`);
  const docRes = await addDoc(userPayRef, cleanData);

  // 2. Save payment record in global 'payments' collection for Admin Panel
  try {
    const globalPayRef = collection(db, 'payments');
    await addDoc(globalPayRef, {
      id: docRes.id,
      userId,
      ...cleanData,
    });
  } catch (err) {
    console.warn('Could not record global payment:', err);
  }

  // 3. Increment coupon usage if used
  if (paymentData.couponCode) {
    redeemCoupon(paymentData.couponCode, userId).catch(() => {});
  }

  // 4. Activate premium status for user
  await setPremiumStatus(userId, true, paymentData.plan);

  return docRes.id;
}

// ==================== COUPON SYSTEM ====================

export interface CouponItem {
  id?: string;
  code: string;
  discountPercent?: number; // e.g. 50 for 50%
  discountAmount?: number; // e.g. 100 for ₹100
  isFree?: boolean; // 100% free upgrade
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export async function validateCoupon(code: string, currentAmount: number): Promise<{
  valid: boolean;
  discount: number;
  finalAmount: number;
  coupon?: CouponItem;
  error?: string;
}> {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, finalAmount: currentAmount, error: 'Please enter a coupon code' };
  }

  const cleanCode = code.trim().toUpperCase();
  let matchedCoupon: CouponItem | null = null;

  try {
    const couponsRef = collection(db, 'coupons');

    // 1. Check exact code in Firestore
    const q1 = query(couponsRef, where('code', '==', cleanCode));
    const snap1 = await getDocs(q1);

    if (!snap1.empty) {
      const docItem = snap1.docs[0];
      const d = docItem.data();
      const isActive = d.isActive !== false && d.is_active !== false && d.active !== false && d.status !== 'inactive';
      
      if (!isActive) {
        return { valid: false, discount: 0, finalAmount: currentAmount, error: 'This coupon is currently inactive' };
      }

      matchedCoupon = {
        id: docItem.id,
        code: cleanCode,
        discountPercent: d.discountPercent || d.discount_percent || d.discountPercentage || d.percentage || (d.discount && d.discount <= 100 ? d.discount : undefined),
        discountAmount: d.discountAmount || d.discount_amount || d.flatDiscount || (d.discount && d.discount > 100 ? d.discount : undefined),
        isFree: Boolean(d.isFree || d.is_free || d.free),
        maxUses: d.maxUses || d.max_uses,
        usedCount: d.usedCount || d.used_count || 0,
        isActive: true,
        expiresAt: d.expiresAt || d.expires_at,
      };
    }

    // 2. Case-insensitive fallback lookup across Firestore coupons
    if (!matchedCoupon) {
      const snapAll = await getDocs(couponsRef);
      for (const docItem of snapAll.docs) {
        const d = docItem.data();
        const docCode = String(d.code || d.coupon_code || docItem.id).trim().toUpperCase();
        if (docCode === cleanCode) {
          const isActive = d.isActive !== false && d.is_active !== false && d.active !== false && d.status !== 'inactive';
          if (!isActive) {
            return { valid: false, discount: 0, finalAmount: currentAmount, error: 'This coupon is currently inactive' };
          }

          matchedCoupon = {
            id: docItem.id,
            code: cleanCode,
            discountPercent: d.discountPercent || d.discount_percent || d.discountPercentage || d.percentage || (d.discount && d.discount <= 100 ? d.discount : undefined),
            discountAmount: d.discountAmount || d.discount_amount || d.flatDiscount || (d.discount && d.discount > 100 ? d.discount : undefined),
            isFree: Boolean(d.isFree || d.is_free || d.free),
            maxUses: d.maxUses || d.max_uses,
            usedCount: d.usedCount || d.used_count || 0,
            isActive: true,
            expiresAt: d.expiresAt || d.expires_at,
          };
          break;
        }
      }
    }
  } catch (firestoreErr) {
    console.warn('Firestore coupon fetch error:', firestoreErr);
    return { valid: false, discount: 0, finalAmount: currentAmount, error: 'Could not connect to verify coupon. Please check network.' };
  }

  // If coupon does not exist in Firestore
  if (!matchedCoupon) {
    return {
      valid: false,
      discount: 0,
      finalAmount: currentAmount,
      error: `Coupon "${code}" not found. Please verify the code.`,
    };
  }

  // Check Expiration Date if set
  if (matchedCoupon.expiresAt) {
    const expiryTime = new Date(matchedCoupon.expiresAt).getTime();
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return { valid: false, discount: 0, finalAmount: currentAmount, error: 'This coupon has expired' };
    }
  }

  // Check Max Uses
  if (matchedCoupon.maxUses && matchedCoupon.usedCount >= matchedCoupon.maxUses) {
    return { valid: false, discount: 0, finalAmount: currentAmount, error: 'This coupon has reached its maximum usage limit' };
  }

  // Calculate discount amount
  let discount = 0;
  if (matchedCoupon.isFree) {
    discount = currentAmount;
  } else if (matchedCoupon.discountPercent) {
    discount = Math.round((currentAmount * matchedCoupon.discountPercent) / 100);
  } else if (matchedCoupon.discountAmount) {
    discount = Math.min(matchedCoupon.discountAmount, currentAmount);
  } else {
    discount = 0;
  }

  const finalAmount = Math.max(0, currentAmount - discount);

  return {
    valid: true,
    discount,
    finalAmount,
    coupon: matchedCoupon,
  };
}

export async function redeemCoupon(code: string, userId: string) {
  const cleanCode = code.trim().toUpperCase();
  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      await updateDoc(doc(db, 'coupons', docSnap.id), {
        usedCount: (data.usedCount || 0) + 1,
        used_count: (data.used_count || 0) + 1,
      });
    }
  } catch (err) {
    console.warn('Redeem coupon record error:', err);
  }
}

// ==================== ADMIN QUERIES ====================

export async function getAllCoupons(): Promise<CouponItem[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch {
    return [];
  }
}

export async function createCoupon(coupon: Omit<CouponItem, 'id' | 'usedCount'>) {
  const clean = {
    ...coupon,
    code: coupon.code.trim().toUpperCase(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, 'coupons'), clean);
  return docRef.id;
}

export async function toggleCouponStatus(couponId: string, isActive: boolean) {
  await updateDoc(doc(db, 'coupons', couponId), { isActive });
}

export async function getAllPaidUsers(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const paidUsers: any[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.is_premium) {
        paidUsers.push({
          id: d.id,
          name: data.name || data.displayName || 'Rupeo User',
          email: data.email || 'No email',
          phone: data.phone || '',
          plan: data.premium_plan || 'lifetime',
          activatedAt: data.premium_activated_at || data.created_at || '',
        });
      }
    });
    return paidUsers;
  } catch (e) {
    console.warn('Error fetching paid users:', e);
    return [];
  }
}

export async function getAllPayments(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'payments'));
    const payments: any[] = [];
    snap.forEach(d => {
      payments.push({ id: d.id, ...d.data() });
    });
    return payments.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  } catch (e) {
    console.warn('Error fetching payments:', e);
    return [];
  }
}
