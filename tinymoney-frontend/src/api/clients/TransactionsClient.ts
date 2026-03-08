import type {
    ImportBankStatementResult,
    NewTransaction,
    TransactionMutationResponse,
    TransactionQueryParams,
    TransactionsResponse
} from "@/api/ApiTypes.ts";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface TransactionsClient {
    getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse>;
    addTransaction(newTransaction: NewTransaction): Promise<TransactionMutationResponse>;
    editTransaction(transactionId: number, newTransaction: NewTransaction): Promise<TransactionMutationResponse>;
    removeTransaction(transactionId: number): Promise<void>;
    removeTransactions(transactionIds: number[]): Promise<void>;
    importBankStatementFile(file: File, fileType: string): Promise<ImportBankStatementResult>;
}

export class TransactionsClientImpl extends ApiBase implements TransactionsClient {
    async getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse> {
        const {
            dateFrom, dateTo, isExpenseFilter, subcategoryIdFilter, vendorIdFilter,
            amountToFilter, amountFromFilter, tagIdFilter, isVerifiedFilter
        } = params;
        const queryParams = new URLSearchParams();
        if (dateFrom) queryParams.append('dateFrom', format(dateFrom, dateFormat));
        if (dateTo) queryParams.append('dateTo', format(dateTo, dateFormat));
        if (isExpenseFilter != undefined) queryParams.append('isExpense', isExpenseFilter.toString());
        if (vendorIdFilter) queryParams.append('vendorId', vendorIdFilter.toString());
        if (subcategoryIdFilter != undefined) queryParams.append('subcategoryId', subcategoryIdFilter.toString());
        if (amountFromFilter != undefined) queryParams.append('amountFrom', amountFromFilter.toString());
        if (amountToFilter != undefined) queryParams.append('amountTo', amountToFilter.toString());
        if (tagIdFilter != undefined) queryParams.append('tagId', tagIdFilter.toString());
        if (isVerifiedFilter != undefined) queryParams.append('isVerified', isVerifiedFilter.toString());

        const res = await this.request('GET', `/transactions?${queryParams}`);
        if (!res.ok) throw new Error('Błąd pobierania danych');
        return res.json();
    }

    async addTransaction(newTransaction: NewTransaction): Promise<TransactionMutationResponse> {
        const res = await this.request('POST', '/transactions', newTransaction);
        if (!res.ok) throw new Error('Błąd podczas dodawania transakcji');
        return res.json();
    }

    async editTransaction(transactionId: number, newTransaction: NewTransaction): Promise<TransactionMutationResponse> {
        const res = await this.request('POST', `/transactions/${transactionId}`, newTransaction);
        if (!res.ok) throw new Error('Błąd podczas zapisywania transakcji');
        return res.json();
    }

    async removeTransaction(transactionId: number): Promise<void> {
        const res = await this.request('DELETE', `/transactions/${transactionId}`);
        if (!res.ok) throw new Error('Błąd podczas usuwania transakcji');
    }

    async removeTransactions(transactionIds: number[]): Promise<void> {
        const res = await this.request('DELETE', '/transactions', transactionIds);
        if (!res.ok) throw new Error('Błąd podczas usuwania transakcji');
    }

    async importBankStatementFile(file: File, fileType: string): Promise<ImportBankStatementResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);
        
        const res = await this.requestFormData('POST', `/transactions/import/file`, formData);
        if (!res.ok) throw new Error('Błąd podczas importu transakcji');
        return res.json();
    }
}
