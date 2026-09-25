export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5
}

export enum JournalEntryType {
  Manual = 1,
  Sales = 2,
  Purchase = 3,
  Payment = 4,
  Inventory = 5,
  Closing = 6
}

export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  typeName: string;
  subtype?: string;
  description?: string;
  currentBalance: number;
  isSystemAccount: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAccountRequest {
  accountCode: string;
  accountName: string;
  type: AccountType;
  subtype?: string;
  description?: string;
  initialBalance?: number;
}

export interface UpdateAccountRequest {
  accountName: string;
  subtype?: string;
  description?: string;
  isActive: boolean;
}

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  reference?: string;
  narration: string;
  entryType: JournalEntryType;
  entryTypeName: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdAt: string;
  lines: JournalEntryLine[];
}

export interface CreateJournalEntryRequest {
  entryDate: string;
  reference?: string;
  narration: string;
  entryType: JournalEntryType;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  typeName: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface ProfitLossItem {
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface ProfitLossCategory {
  categoryName: string;
  items: ProfitLossItem[];
  subtotal: number;
}

export interface ProfitLossReport {
  fromDate: string;
  toDate: string;
  revenue: ProfitLossCategory;
  costOfGoodsSold: ProfitLossCategory;
  grossProfit: number;
  operatingExpenses: ProfitLossCategory;
  totalOperatingExpenses: number;
  netProfit: number;
  netProfitMarginPercentage: number;
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface BalanceSheetCategory {
  categoryName: string;
  items: BalanceSheetItem[];
  subtotal: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  currentAssets: BalanceSheetCategory;
  nonCurrentAssets: BalanceSheetCategory;
  totalAssets: number;
  currentLiabilities: BalanceSheetCategory;
  nonCurrentLiabilities: BalanceSheetCategory;
  totalLiabilities: number;
  equity: BalanceSheetCategory;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface GstSummaryReport {
  fromDate: string;
  toDate: string;
  outwardTaxableAmount: number;
  cgstOutput: number;
  sgstOutput: number;
  igstOutput: number;
  totalOutputTax: number;
  inwardTaxableAmount: number;
  cgstInputCredit: number;
  sgstInputCredit: number;
  igstInputCredit: number;
  totalInputCredit: number;
  netCgstPayable: number;
  netSgstPayable: number;
  netIgstPayable: number;
  netTotalTaxPayable: number;
}
