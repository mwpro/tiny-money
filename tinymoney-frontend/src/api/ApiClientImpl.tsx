import type {ApiClient} from "@/apiClient.tsx";
import type {Auth0ContextInterface, User} from "@auth0/auth0-react";
import type {TransactionQueryParams, TransactionsResponse} from "@/lib/api.ts";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import type {Configuration} from "@/main.tsx";

export class ApiClientImpl implements ApiClient {
    private _auth: Auth0ContextInterface<User>;
    private _configuration: Configuration;

    constructor(auth: Auth0ContextInterface<User>, configuration: Configuration) {
        this._auth = auth;
        this._configuration = configuration;

    }

    async getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse> {
        const token = await this._auth.getAccessTokenSilently();
        const {
            dateFrom,
            dateTo,
            isExpenseFilter,
            subcategoryIdFilter,
            vendorIdFilter,
            amountToFilter,
            amountFromFilter,
            tagIdFilter
        } = params;
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

        const response = await fetch(`${this._configuration.apiUrl}/transactions?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania danych');
        }

        return response.json();
    }

}