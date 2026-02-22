import {type Auth0ContextInterface} from "@auth0/auth0-react";
import {format} from "date-fns";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {dateFormat} from "@/lib/utils.ts";
import type {TagInputs} from "@/features/tags/TagEditorDialog.tsx";

export type Transaction = {
    id: number;
    amount: number;
    createdDate: string;
    description: string | undefined;
    isExpense: boolean;
    modifiedDate: string;
    transactionDate: string;
    vendorId: number;
    subcategoryId: number;
    tagIds: number[];
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

const API_URL = import.meta.env.VITE_API_URL;

export const getTransactions = async (auth: Auth0ContextInterface, params: TransactionQueryParams): Promise<TransactionsResponse> => {
    const token = await auth.getAccessTokenSilently();
    const {dateFrom, dateTo, isExpenseFilter, subcategoryIdFilter, vendorIdFilter, amountToFilter, amountFromFilter, tagIdFilter} = params;
    const queryParams = new URLSearchParams();
    if (dateFrom) {
        queryParams.append('dateFrom', format(dateFrom, dateFormat))        
    }
    if (dateTo) {
        queryParams.append('dateTo', format(dateTo, dateFormat));
    }
    if (isExpenseFilter != undefined) {
        queryParams.append('isExpense', isExpenseFilter.toString());
    }
    if (vendorIdFilter) {
        queryParams.append('vendorId', vendorIdFilter.toString());
    }
    if (subcategoryIdFilter != undefined) {
        queryParams.append('subcategoryId', subcategoryIdFilter.toString());
    }
    if (amountFromFilter != undefined) {
        queryParams.append('amountFrom', amountFromFilter.toString());
    }
    if (amountToFilter != undefined) {
        queryParams.append('amountTo', amountToFilter.toString());
    }
    if (tagIdFilter != undefined) {
        queryParams.append('tagId', tagIdFilter.toString());
    }
    
    const response = await fetch(`${API_URL}/transactions?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Błąd pobierania danych');
    }

    return response.json();
};

export type NewTransaction = {
    amount: number;
    isExpense: boolean;
    transactionDate: string;
    description?: string | undefined,
    vendor: VendorUpsert,
    subcategoryId: number;
    tags: TagUpsert[]
}

export type VendorUpsert = {
    id?: number | undefined,
    name: string
}

export type TagUpsert = {
    id?: number | undefined,
    name: string
}

export const addTransaction = async (newTransaction: NewTransaction, auth: Auth0ContextInterface): Promise<Transaction> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTransaction),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas dodawania transakcji');
    }

    return response.json();
};

export const addTag = async (newTag: TagInputs, auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/tags`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTag),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas dodawania tagu');
    }
};

export const editTransaction = async (transactionId: number, 
                                      newTransaction: NewTransaction, auth: Auth0ContextInterface): Promise<Transaction> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTransaction),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas zapisywania transakcji');
    }

    return response.json();
};

export const editTag = async (tagId: number,
                              newTag: TagInputs, auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/tags/${tagId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTag),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas zapisywania tagu');
    }
};

export const removeTransaction = async (transactionId: number, auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        throw new Error('Błąd podczas usuwania transakcji');
    }
};

export const removeTag = async (tagId: number, auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        throw new Error('Błąd podczas usuwania tagu');
    }
};

export const removeVendor = async (vendorId: number, vendorIdToMerge: number | undefined, auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();
    
    const response = await fetch(`${API_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mergeToVendorId: vendorIdToMerge
        }),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas usuwania sprzedawcy');
    }
};

export type Vendor = { id: number; name: string, defaultSubcategoryId: number };
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

export const getVendors = async (auth: Auth0ContextInterface): Promise<Vendor[]> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/vendors`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
    return res.json();
};

export const getCategories = async (auth: Auth0ContextInterface): Promise<Category[]> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/categories`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania kategorii');
    return res.json();
};

export const getTags = async (auth: Auth0ContextInterface): Promise<Tag[]> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/tags`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania tagów');
    return res.json();
};

export const getVendorsDetails = async (auth: Auth0ContextInterface): Promise<VendorDetails[]> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/vendors?detailed=true`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
    return res.json();
};

export const getBudget = async (auth: Auth0ContextInterface, month: MonthSelection): Promise<Budget> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/budget/${month.year}/${month.month}?useV2=true`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania budżetu');
    return res.json();
};

export const copyBudget = async (auth: Auth0ContextInterface, from: MonthSelection, to: MonthSelection): Promise<void> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/budget/${from.year}/${from.month}/copy/${to.year}/${to.month}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd kopiowania budżetu');
};

export const getBudgetSuggestions = async (auth: Auth0ContextInterface, month: MonthSelection): Promise<BudgetSuggestionsResponse> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/budget/${month.year}/${month.month}/suggestions`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania podpowiedzi budżetu');
    return res.json();
};

export const saveBudget = async (month: MonthSelection, subcategoryId: number, amount: number, notes: string | undefined,
                                 auth: Auth0ContextInterface): Promise<void> => {
    const token = await  auth.getAccessTokenSilently();

    const response = await fetch(`${API_URL}/budget/${month.year}/${month.month}/subcategory/${subcategoryId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            budgetAmount: amount,
            notes: notes
        }),
    });

    if (!response.ok) {
        throw new Error('Błąd podczas zapisu budżetu');
    }
}

export const getSummaryReport = async (auth: Auth0ContextInterface,
                                       dateFrom: Date | undefined, dateTo: Date | undefined,
                                       splitByMonth: boolean): Promise<SummaryReport> => {
    const token = await auth.getAccessTokenSilently();
    const queryParams = new URLSearchParams();
    dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
    dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
    queryParams.append('splitByMonth', splitByMonth ? "true" : "false");

    const res = await fetch(`${API_URL}/reports/summary-report?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania raportu');
    return res.json();
};

export const getTopListReport = async (auth: Auth0ContextInterface,
                                       dateFrom: Date | undefined, dateTo: Date | undefined): Promise<TopListReport> => {
    const token = await auth.getAccessTokenSilently();
    const queryParams = new URLSearchParams();
    dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
    dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
    queryParams.append('numberOfTopEntries', "15");

    const res = await fetch(`${API_URL}/reports/top-list-report?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania raportu');
    return res.json();
};
export const getSankeyReport = async (auth: Auth0ContextInterface,
                                       dateFrom: Date | undefined, dateTo: Date | undefined): Promise<SankeyReport> => {
    const token = await auth.getAccessTokenSilently();
    const queryParams = new URLSearchParams();
    dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
    dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));

    const res = await fetch(`${API_URL}/reports/sankey-report?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania raportu');
    return res.json();
};