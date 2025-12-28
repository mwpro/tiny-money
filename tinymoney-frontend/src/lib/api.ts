// src/lib/api.ts

// Tutaj definiujemy typy. Dzięki temu, jak backend zmieni nazwę pola,
// TypeScript wywali błąd kompilacji na froncie.
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
    tagsIds: number[];
}

// Bazowy URL Twojego API (zmień port na ten, na którym działa Twój .NET)
const API_URL = "http://localhost:52386/api";

export const getTransactions = async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/transactions?month=2025-11`);

    if (!response.ok) {
        throw new Error('Błąd pobierania danych');
    }

    // Fetch w JS domyślnie nie rzuca błędem przy 404/500, dlatego sprawdzamy response.ok
    // ASP.NET domyślnie zwraca JSON w camelCase (id, date), co pasuje do JS.
    return response.json();
};