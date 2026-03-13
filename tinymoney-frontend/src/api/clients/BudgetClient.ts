import type {Budget, BudgetSuggestionsResponse} from "@/api/ApiTypes.ts";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {ApiBase} from "@/api/ApiBase.ts";

export interface BudgetClient {
    getBudget(month: MonthSelection): Promise<Budget>;
    copyBudget(from: MonthSelection, to: MonthSelection): Promise<void>;
    getBudgetSuggestions(month: MonthSelection): Promise<BudgetSuggestionsResponse>;
    saveBudget(month: MonthSelection, subcategoryId: number, amount: number, notes: string | undefined): Promise<void>;
}

export class BudgetClientImpl extends ApiBase implements BudgetClient {
    async getBudget(month: MonthSelection): Promise<Budget> {
        const res = await this.request('GET', `/budget/${month.year}/${month.month}`);
        if (!res.ok) throw new Error('Błąd pobierania budżetu');
        return res.json();
    }

    async copyBudget(from: MonthSelection, to: MonthSelection): Promise<void> {
        const res = await this.request('POST', `/budget/${from.year}/${from.month}/copy/${to.year}/${to.month}`);
        if (!res.ok) throw new Error('Błąd kopiowania budżetu');
    }

    async getBudgetSuggestions(month: MonthSelection): Promise<BudgetSuggestionsResponse> {
        const res = await this.request('GET', `/budget/${month.year}/${month.month}/suggestions`);
        if (!res.ok) throw new Error('Błąd pobierania podpowiedzi budżetu');
        return res.json();
    }

    async saveBudget(month: MonthSelection, subcategoryId: number, amount: number, notes: string | undefined): Promise<void> {
        const res = await this.request('POST', `/budget/${month.year}/${month.month}/subcategory/${subcategoryId}`, {
            budgetAmount: amount,
            notes
        });
        if (!res.ok) throw new Error('Błąd podczas zapisu budżetu');
    }
}
