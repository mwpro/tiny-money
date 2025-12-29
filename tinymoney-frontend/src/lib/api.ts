// src/lib/api.ts

// Tutaj definiujemy typy. Dzięki temu, jak backend zmieni nazwę pola,
// TypeScript wywali błąd kompilacji na froncie.
import {type Auth0ContextInterface} from "@auth0/auth0-react";

export type Transaction = {
    id: number;
    amount: number;
    createdDate: string;
    description: string;
    isExpense: boolean;
    modifiedDate: string;
    transactionDate: string;
    vendorId: number;
    subcategoryId: number;
    tagIds: number[];
}

// Bazowy URL Twojego API (zmień port na ten, na którym działa Twój .NET)
const API_URL = import.meta.env.VITE_API_URL;

export const getTransactions = async (auth: Auth0ContextInterface): Promise<Transaction[]> => {
    const token = await auth.getAccessTokenSilently();

    const response = await fetch(`${API_URL}/transactions?month=2025-12`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Błąd pobierania danych');
    }

    // Fetch w JS domyślnie nie rzuca błędem przy 404/500, dlatego sprawdzamy response.ok
    // ASP.NET domyślnie zwraca JSON w camelCase (id, date), co pasuje do JS.
    return response.json();
};

export type NewTransaction = {
    amount: number;
    isExpense: boolean;
    transactionDate: string;
    description: string,
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

// src/lib/api.ts

// ... (Twoja definicja Transaction i getTransactions zostaje)

// Typy słownikowe
export type Vendor = { id: number; name: string, defaultSubcategoryId: number };
export type Category = { id: number, name: string, subcategories: Subcategory[] };
export type Subcategory = { id: number; name: string };
export type Tag = { id: number; name: string };

// Funkcje pobierające
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