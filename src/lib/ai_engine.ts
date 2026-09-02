/**
 * Financial Analytics & Summary Helpers (Non-AI, 100% Deterministic)
 */

export interface FinancialSummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  currency: string;
  periodName: string;
  monthlyBudget?: number;
  categoryBreakdown: { name: string; amount: number; percentage: number }[];
  topExpenses: { name: string; amount: number; category: string }[];
  transactionCount: number;
}
