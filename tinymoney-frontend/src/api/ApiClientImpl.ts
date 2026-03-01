import type {Auth0ContextInterface} from "@auth0/auth0-react";
import type {Budget, BudgetSuggestionsResponse, Category,
    ImportBankStatementResult,
    NewTransaction,
    SankeyReport,
    SummaryReport,
    Tag,
    TopListReport,
    Transaction,
    TransactionQueryParams,
    TransactionsResponse,
    Vendor,
    VendorDetails
} from "@/api/ApiTypes.ts";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import type {Configuration} from "@/main.tsx";
import type {ApiClient} from "@/api/ApiClient.tsx";
import type {MonthSelection} from "@/components/MonthPicker";
import type {TagInputs} from "@/features/tags/TagEditorDialog";
import type {VendorInputs} from "@/features/vendors/VendorEditorDialog";

export class ApiClientImpl implements ApiClient {
    private _auth: Auth0ContextInterface;
    private _configuration: Configuration;

    constructor(auth: Auth0ContextInterface, configuration: Configuration) {
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
            tagIdFilter,
            isVerifiedFilter
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
        if (isVerifiedFilter != undefined) {
            queryParams.append('isVerified', isVerifiedFilter.toString());
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

    async addTransaction(newTransaction: NewTransaction): Promise<Transaction> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/transactions`, {
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
    }
    
    async editTransaction(transactionId: number, newTransaction: NewTransaction): Promise<Transaction> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/transactions/${transactionId}`, {
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
    }

    async removeTransaction(transactionId: number): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('Błąd podczas usuwania transakcji');
        }
    }

    async getTags(): Promise<Tag[]> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/tags`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania tagów');
        return res.json();
    }

    async addTag(newTag: TagInputs): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/tags`, {
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
    }

    async editTag(tagId: number, newTag: TagInputs): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/tags/${tagId}`, {
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
    }

    async removeTag(tagId: number): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/tags/${tagId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('Błąd podczas usuwania tagu');
        }
    }

    async getVendors(): Promise<Vendor[]> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/vendors`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
        return res.json();
    }

    async getVendorsDetails(): Promise<VendorDetails[]> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/vendors?detailed=true`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
        return res.json();
    }

    async addVendor(newVendor: VendorInputs): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/vendors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newVendor),
        });

        if (!response.ok) {
            throw new Error('Błąd podczas dodawania sprzedawcy');
        }
    }

    async editVendor(vendorId: number, newVendor: VendorInputs): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/vendors/${vendorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newVendor),
        });

        if (!response.ok) {
            throw new Error('Błąd podczas zapisywania sprzedawcy');
        }
    }
    async removeVendor(vendorId: number, vendorIdToMerge: number | undefined): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/vendors/${vendorId}`, {
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
    }

    async getCategories(): Promise<Category[]> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/categories`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania kategorii');
        return res.json();
    }

    async getBudget(month: MonthSelection): Promise<Budget> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/budget/${month.year}/${month.month}?useV2=true`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania budżetu');
        return res.json();
    }

    async copyBudget(from: MonthSelection, to: MonthSelection): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/budget/${from.year}/${from.month}/copy/${to.year}/${to.month}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd kopiowania budżetu');
    }

    async getBudgetSuggestions(month: MonthSelection): Promise<BudgetSuggestionsResponse> {
        const token = await this._auth.getAccessTokenSilently();
        const res = await fetch(`${this._configuration.apiUrl}/budget/${month.year}/${month.month}/suggestions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania podpowiedzi budżetu');
        return res.json();
    }

    async saveBudget(month: MonthSelection, subcategoryId: number, amount: number, notes: string | undefined): Promise<void> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/budget/${month.year}/${month.month}/subcategory/${subcategoryId}`, {
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

    async getSummaryReport(dateFrom: Date | undefined, dateTo: Date | undefined, splitByMonth: boolean): Promise<SummaryReport> {
        const token = await this._auth.getAccessTokenSilently();
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
        queryParams.append('splitByMonth', splitByMonth ? "true" : "false");

        const res = await fetch(`${this._configuration.apiUrl}/reports/summary-report?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }

    async getTopListReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<TopListReport> {
        const token = await this._auth.getAccessTokenSilently();
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
        queryParams.append('numberOfTopEntries', "15");

        const res = await fetch(`${this._configuration.apiUrl}/reports/top-list-report?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }

    async getSankeyReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<SankeyReport> {
        const token = await this._auth.getAccessTokenSilently();
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));

        const res = await fetch(`${this._configuration.apiUrl}/reports/sankey-report?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }

    async importBankStatement(fileContent: string, fileType: string): Promise<ImportBankStatementResult> {
        const token = await this._auth.getAccessTokenSilently();

        const response = await fetch(`${this._configuration.apiUrl}/transactions/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fileContent, fileType }),
        });

        if (!response.ok) {
            throw new Error('Błąd podczas importu transakcji');
        }

        return response.json();
    }
}