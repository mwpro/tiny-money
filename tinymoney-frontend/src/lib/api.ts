import {type Auth0ContextInterface} from "@auth0/auth0-react";
import {format} from "date-fns";
import type {MonthSelection} from "@/components/MonthPicker.tsx";

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

export interface TransactionQueryParams {
    dateFrom: Date | undefined,
    dateTo: Date | undefined;
    isExpenseFilter: boolean | undefined;
    vendorIdFilter: number | undefined;
    subcategoryIdFilter: number | undefined;
    amountFromFilter: number | undefined;
    amountToFilter: number | undefined
}

export interface Budget {
    budgetEntries: BudgetEntry[]
}

export interface BudgetEntry {
    amount: number,
    notes: string | undefined,
    subcategoryId: number,
    usedAmount: number
}

const API_URL = import.meta.env.VITE_API_URL;

export const getTransactions = async (auth: Auth0ContextInterface, params: TransactionQueryParams): Promise<Transaction[]> => {
    const token = await auth.getAccessTokenSilently();
    const {dateFrom, dateTo, isExpenseFilter, subcategoryIdFilter, vendorIdFilter, amountToFilter, amountFromFilter} = params;
    const queryParams = new URLSearchParams();
    if (dateFrom) {
        queryParams.append('dateFrom', format(dateFrom, 'yyyy-MM-dd'))        
    }
    if (dateTo) {
        queryParams.append('dateTo', format(dateTo, 'yyyy-MM-dd'));
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

export type Vendor = { id: number; name: string, defaultSubcategoryId: number };
export type Category = { id: number, name: string, subcategories: Subcategory[] };
export type Subcategory = { id: number; name: string };
export type Tag = { id: number; name: string };
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

export const getBudget = async (auth: Auth0ContextInterface, month: MonthSelection): Promise<Budget> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/budget/${month.year}/${month.month}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania budżetu');
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