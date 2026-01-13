import {useQuery} from "@tanstack/react-query"
import {
    getCategories, getTags, getTransactions, getVendors, type Transaction, type TransactionTypeFilter,
    TransactionTypeFilterEnum
} from "@/lib/api"
import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useState} from "react";
import {TransactionRemovalDialog} from "@/features/transactions/TransactionRemovalDialog.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {DatePicker} from "@/components/DatePicker.tsx";
import {endOfMonth, format, parse, startOfMonth} from 'date-fns';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {useSearchParams} from "react-router-dom";
import {TransactionsTable} from "@/features/transactions/TransactionsTable.tsx";


export function TransactionsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [dateFrom, setDateFrom] = useState<Date>(() => searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, "yyyy-MM-dd", new Date()) : startOfMonth(new Date()));
    const [dateTo, setDateTo] = useState<Date>(() => searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, "yyyy-MM-dd", new Date()) : endOfMonth(new Date()));
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>(() => searchParams.get("transactionType") ? Number(searchParams.get("transactionType")) as TransactionTypeFilter : TransactionTypeFilterEnum.EXPENSE);

    const transactionsQuery = useQuery({
        queryKey: ['transactions', dateFrom, dateTo, transactionTypeFilter],
        queryFn: () => getTransactions(auth, dateFrom, dateTo, transactionTypeFilter),
    })

    useEffect(() => {
            setSearchParams({dateFrom: format(dateFrom, "yyyy-MM-dd"), dateTo: format(dateTo, "yyyy-MM-dd"), transactionType: transactionTypeFilter.toString()})
        },
        [dateFrom, dateTo, transactionTypeFilter]);

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const vendorsQuery = useQuery({
        queryKey: ['vendors'],
        queryFn: () => getVendors(auth),
        ...dictionariesConfig
    })
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(auth),
        ...dictionariesConfig
    })
    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => getTags(auth),
        ...dictionariesConfig
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Lista transakcji</h1>
                <TransactionsEditorDialog transactionToEdit={transactionToEdit}
                                          onClose={() => setTransactionToEdit(undefined)}/>
                <TransactionRemovalDialog transactionToRemove={transactionToRemove}
                                          onClose={() => setTransactionToRemove(undefined)}/>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <DatePicker dateFrom={dateFrom} dateTo={dateTo} onChange={(dateFrom, dateTo) => {
                    dateFrom && setDateFrom(dateFrom);
                    dateTo && setDateTo(dateTo);
                }}/>
                <Select value={transactionTypeFilter.toString()}
                        onValueChange={val => setTransactionTypeFilter(Number(val) as TransactionTypeFilter)}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Rodzaj transakcji"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={TransactionTypeFilterEnum.ALL.toString()}>Wszystkie</SelectItem>
                            <SelectItem value={TransactionTypeFilterEnum.EXPENSE.toString()}>Wydatki</SelectItem>
                            <SelectItem value={TransactionTypeFilterEnum.INCOME.toString()}>Przychody</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {(transactionsQuery.isLoading || vendorsQuery.isLoading || categoriesQuery.isLoading || tagsQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(transactionsQuery.isError || vendorsQuery.isError || categoriesQuery.isError || tagsQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {transactionsQuery.data && vendorsQuery.data && categoriesQuery.data && tagsQuery.data &&
                <TransactionsTable 
                    transactions={transactionsQuery.data} vendors={vendorsQuery.data} subcategories={categoriesQuery.data} tags={tagsQuery.data}
                    onEditClick={t => setTransactionToEdit(t)} onDeleteClick={t => setTransactionToRemove(t)} />
            }
        </div>
    )
}