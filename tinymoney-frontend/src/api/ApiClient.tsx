import type {TransactionQueryParams, TransactionsResponse} from "@/lib/api.ts";

export interface ApiClient {
    getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse>;
}