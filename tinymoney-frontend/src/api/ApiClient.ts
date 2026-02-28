import type {
    Budget, BudgetSuggestionsResponse,
    Category,
    NewTransaction, SankeyReport, SummaryReport, Tag, TopListReport,
    Transaction,
    TransactionQueryParams,
    TransactionsResponse,
    Vendor, VendorDetails
} from "@/api/ApiTypes.ts";
import type {TagInputs} from "@/features/tags/TagEditorDialog.tsx";
import type {VendorInputs} from "@/features/vendors/VendorEditorDialog.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";

export interface ApiClient {
    getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse>;
    addTransaction(newTransaction: NewTransaction): Promise<Transaction>;
    editTransaction(transactionId: number, newTransaction: NewTransaction): Promise<Transaction>;
    removeTransaction(transactionId: number): Promise<void>;

    getTags(): Promise<Tag[]>;
    addTag(newTag: TagInputs): Promise<void>;
    editTag(tagId: number, newTag: TagInputs): Promise<void>;
    removeTag(tagId: number): Promise<void>;

    getVendors(): Promise<Vendor[]>;
    getVendorsDetails(): Promise<VendorDetails[]>;
    addVendor(newVendor: VendorInputs): Promise<void>;
    editVendor(vendorId: number, newVendor: VendorInputs): Promise<void>;
    removeVendor(vendorId: number, vendorIdToMerge: number | undefined): Promise<void>;

    getCategories(): Promise<Category[]>;

    getBudget(month: MonthSelection): Promise<Budget>;
    copyBudget(from: MonthSelection, to: MonthSelection): Promise<void>;
    getBudgetSuggestions(month: MonthSelection): Promise<BudgetSuggestionsResponse>;
    saveBudget(month: MonthSelection, subcategoryId: number, amount: number, notes: string | undefined): Promise<void>;

    getSummaryReport(dateFrom: Date | undefined, dateTo: Date | undefined, splitByMonth: boolean): Promise<SummaryReport>;
    getTopListReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<TopListReport>;
    getSankeyReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<SankeyReport>;
}