import {type Auth0ContextInterface} from "@auth0/auth0-react";

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

const API_URL = import.meta.env.VITE_API_URL;

export const getTransactions = async (auth: Auth0ContextInterface, dateFrom: Date, dateTo: Date): Promise<Transaction[]> => {
    const token = await auth.getAccessTokenSilently();

    const dateFromStr = `${dateFrom.getFullYear()}-${(dateFrom.getMonth() + 1)}-${dateFrom.getDate()}`;
    const dateToStr = `${dateTo.getFullYear()}-${(dateTo.getMonth() + 1)}-${dateTo.getDate()}`;
    const response = await fetch(`${API_URL}/transactions?dateFrom=${dateFromStr}&dateTo=${dateToStr}`, {
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
    description: string | undefined,
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

export const getCategories = async (auth: Auth0ContextInterface): Promise<Subcategories> => {
    const token = await auth.getAccessTokenSilently();
    const res = await fetch(`${API_URL}/categories`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Błąd pobierania kategorii');
    const responseData: Category[] = await res.json();

    return new Map<number, string>(responseData.flatMap(c => c.subcategories.map(s => ([ s.id, `${c.name} / ${s.name}` ]))));
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