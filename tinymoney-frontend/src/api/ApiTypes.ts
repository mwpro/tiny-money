export type Transaction = {
    id: number;
    amount: number;
    createdDate: string;
    description: string | undefined;
    isExpense: boolean;
    modifiedDate: string;
    transactionDate: string;
    vendorId: number | null;
    subcategoryId: number | null;
    tagIds: number[];
    isVerified: boolean;
    isPossibleDuplicate: boolean;
}

export type TransactionsResponse = {
    transactions: Transaction[];
    summary: TransactionsSummary;
}

export type TransactionsSummary = {
    incomesTotal: number;
    incomesCount: number;
    expensesTotal: number;
    expensesCount: number;
    balance: number;
}

export interface TransactionQueryParams {
    dateFrom: Date | undefined,
    dateTo: Date | undefined;
    isExpenseFilter: boolean | undefined;
    vendorIdFilter: number | undefined;
    subcategoryIdFilter: number | undefined;
    amountFromFilter: number | undefined;
    amountToFilter: number | undefined,
    tagIdFilter: number | undefined,
    isVerifiedFilter: boolean | undefined,
}

export interface BudgetSuggestionsResponse {
    subcategoryBudgetSuggestions: SubcategoryBudgetSuggestions[]
}

export interface SubcategoryBudgetSuggestions {
    subcategoryId: number,
    suggestions: BudgetSuggestion[]
}

export interface BudgetSuggestion {
    suggestionName: string,
    suggestedAmount: number
}

export interface Budget {
    monthlyBudget: MonthlyBudget
}

export interface MonthlyBudget {
    amount: number,
    usedAmount: number,
    amountLeft: number,
    
    categoryBudgets: CategoryBudget[]
}

export interface CategoryBudget {
    categoryId: number,
    categoryName: string,
    
    amount: number,
    usedAmount: number
    amountLeft: number,
    
    subcategoryBudgets: SubcategoryBudget[]
}

export interface SubcategoryBudget {
    subcategoryId: number,
    subcategoryName: string,
    
    amount: number,
    usedAmount: number
    amountLeft: number,
    
    notes: string | undefined
}

export interface SummaryReport {
    categories: ReportCategory[]
    periods: ReportPeriod[],

    incomesAvg: number,
    incomesSum: number,
    expensesAvg: number,
    expensesSum: number,
    balanceAvg: number,
    balanceSum: number
}

export interface ReportPeriod {
    periodLabel: string,
    
    budget: number,
    budgetDifference: number,
    incomesSum: number,
    expensesSum: number,
    balance: number
}

export interface ReportCategory
{
    categoryId: number,
    categoryName: string,
    isIncome: boolean,
    
    transactionsSum: number,
    transactionsAvg: number,
    
    periods: ReportPeriodCategory[],
    subcategories: ReportSubcategory[]
}

export interface ReportPeriodCategory {
    periodLabel: string,
    transactionsSum: number
}
export interface ReportSubcategory {
    subcategoryId: number,
    subcategoryName: string,
    
    transactionsSum: number,
    transactionsAvg: number,

    periods: ReportPeriodSubcategory[],
}
export interface ReportPeriodSubcategory {
    periodLabel: string,
    transactionsSum: number
}

export interface SankeyReport {
    root: SankeyChart
}

export interface SankeyChart {

    nodes: SankeyNodeData[],
    links: SankeyLinkData[]
}

export interface SankeyNodeData {
    name: string,
    subChart: SankeyChart
}

export interface SankeyLinkData {
    source: number,
    target: number,
    value: number,
    isExpense: boolean
}

export interface TopListReport {
    expenses: TopTransaction[],
    incomes: TopTransaction[],
    expenseVendors: TopEntry[],
    incomeVendors: TopEntry[],
    tags: TopEntry[]
}

export interface TopTransaction {
    id: number,
    vendorId: number,
    vendorName: string,
    transactionDate: string,
    amount: number
}

export interface TopEntry {
    id: number,
    description: string,
    amount: number,
    numberOfTransactions: number
}

export type SuggestedAlias = { alias: string; vendorId: number };

export type TransactionMutationResponse = {
    transaction: Transaction;
    newVendor?: VendorUpsert;
    newTags?: TagUpsert[];
    suggestedAlias?: SuggestedAlias | null;
};

export type NewTransaction = {
    amount: number;
    isExpense: boolean;
    transactionDate: string;
    description?: string | undefined,
    vendor: VendorUpsert,
    subcategoryId: number;
    tags: TagUpsert[];
}

export type ImportBankStatementResult = {
    numberOfImportedTransactions: number;
    numberOfPossibleDuplicates: number;
};

export type VendorUpsert = {
    id?: number | undefined,
    name: string
}

export type TagUpsert = {
    id?: number | undefined,
    name: string
}

export type Vendor = { id: number; name: string, defaultSubcategoryId: number };
export type VendorAlias = { id: number; alias: string };
export type VendorWithAliases = { details: VendorDetails; aliases: VendorAlias[] };
export type VendorDetails = {
    id: number;
    name: string,
    defaultSubcategoryId: number,
    subcategoryName: string,
    categoryName: string,
    isIncomeCategory: boolean,
    numberOfTransactions: number,
    lastTransactionDate: string | undefined
};
export type Category = { id: number, name: string, isIncome: boolean, subcategories: Subcategory[] };
export type Subcategory = { id: number; name: string };
export type Tag = { id: number; name: string, numberOfTransactions: number };
export type Subcategories = Map<number, string>;

export type DailyExpense = { day: number; amount: number, budgetLeft: number };
export type CategoryBudgetSummary = { subcategoryId: number, categoryName: string, subcategoryName: string; amount: number; amountLeft: number; notes: string | null };
export type DashboardResponse = {
    incomesTotal: number;
    expensesTotal: number;
    budgetAmount: number;
    budgetUsed: number;
    budgetLeft: number;
    unverifiedCount: number;
    dailyExpenses: DailyExpense[];
    topRemainingBudgetCategories: CategoryBudgetSummary[];
    topOverspentBudgetCategories: CategoryBudgetSummary[];
};

export type ApiKeySummary = {
    id: number;
    name: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
};

export type CreateApiKeyRequest = {
    name: string;
};

export type CreateApiKeyResponse = {
    id: number;
    name: string;
    keyPrefix: string;
    rawKey: string;
};