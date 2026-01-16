import {useQuery} from "@tanstack/react-query"
import {
    getCategories, getTags, getTransactions, getVendors, type Transaction, type TransactionQueryParams, type Vendor
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
    SelectItem, SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {useSearchParams} from "react-router-dom";
import {TransactionsTable} from "@/features/transactions/TransactionsTable.tsx";
import Autocomplete from "@/components/Autocomplete.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useDebouncedValue} from "@tanstack/react-pacer";


export function TransactionsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [queryParams, setQueryParams] = useState<TransactionQueryParams>(() =>
        ({
            dateFrom: searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, "yyyy-MM-dd", new Date()) : startOfMonth(new Date()),
            dateTo: searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, "yyyy-MM-dd", new Date()) : endOfMonth(new Date()),
            isExpenseFilter: searchParams.get("isExpense") != undefined ? searchParams.get("isExpense") == "true" : undefined,
            amountFromFilter: searchParams.get("amountFrom") ? Number(searchParams.get("amountFrom")) : undefined,
            amountToFilter: searchParams.get("amountTo") ? Number(searchParams.get("amountTo")) : undefined,
            subcategoryIdFilter: searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined,
            vendorIdFilter: searchParams.get("vendorId") ? Number(searchParams.get("vendorId")) : undefined
        })); 
    const [vendorFilter, setVendorFilter] = useState<Vendor | undefined>(() => searchParams.get("vendorId") ? {
        id: Number(searchParams.get("vendorId")),
        name: "",
        defaultSubcategoryId: 0
    } : undefined);
   
    const [debouncedQueryParams] = useDebouncedValue(queryParams, {
        wait: 300
    });
    const transactionsQuery = useQuery({
        queryKey: ['transactions', debouncedQueryParams],
        queryFn: () => getTransactions(auth, debouncedQueryParams)
    })

    useEffect(() => {
            const {dateFrom, dateTo, isExpenseFilter, vendorIdFilter, subcategoryIdFilter, amountFromFilter, amountToFilter} = debouncedQueryParams;
            setSearchParams((params) => {
                params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
                params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
                isExpenseFilter != undefined ? params.set("isExpense", isExpenseFilter.toString()) : params.delete("isExpense");
                amountFromFilter ? params.set("amountFrom", amountFromFilter.toString()) : params.delete("amountFrom");
                amountToFilter ? params.set("amountTo", amountToFilter.toString()) : params.delete("amountTo");
                vendorIdFilter ? params.set("vendorId", vendorIdFilter.toString()) : params.delete("vendorId");
                subcategoryIdFilter ? params.set("subcategoryId", subcategoryIdFilter.toString()) : params.delete("subcategoryId");
                return params;
            })
        },
        [debouncedQueryParams]);

    useEffect(() => {
            if (!searchParams.size) {
                setQueryParams({
                    dateFrom: startOfMonth(new Date()),
                    dateTo: endOfMonth(new Date()),
                    isExpenseFilter: undefined,
                    amountFromFilter: undefined,
                    amountToFilter: undefined,
                    subcategoryIdFilter: undefined,
                    vendorIdFilter: undefined
                });
            }
        },
        [searchParams]);

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
    const subcategoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(auth),
        select: data => (new Map<number, string>(data.flatMap(c => c.subcategories.map(s => ([s.id, `${c.name} / ${s.name}`]))))),
        ...dictionariesConfig
    })
    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => getTags(auth),
        ...dictionariesConfig
    })

    useEffect(() => {
        if (vendorsQuery.data && queryParams.vendorIdFilter) {
            const selectedVendor = vendorsQuery.data?.find(v => v.id === queryParams.vendorIdFilter)
            setVendorFilter(selectedVendor)
        }
    }, [vendorsQuery.data, queryParams.vendorIdFilter, vendorFilter]);

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
                <DatePicker dateFrom={queryParams.dateFrom} dateTo={queryParams.dateTo} onChange={(dateFrom, dateTo) => {
                    dateFrom && setQueryParams(prevState => ({...prevState, dateFrom}));
                    dateTo && setQueryParams(prevState => ({...prevState, dateTo}));
                }}/>
                <Select value={queryParams.isExpenseFilter?.toString() ?? "__NONE__"}
                        onValueChange={val => {
                            switch (val) {
                                case true.toString():
                                    setQueryParams(prevState => ({...prevState, isExpenseFilter: true}));
                                    break;
                                case false.toString():
                                    setQueryParams(prevState => ({...prevState, isExpenseFilter: false}));
                                    break;
                                default:
                                    setQueryParams(prevState => ({...prevState, isExpenseFilter: undefined}));
                                    break;
                            }
                        }}>
                    <SelectTrigger className={`w-[150px] bg-background ${queryParams.isExpenseFilter == undefined ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{ queryParams.isExpenseFilter != undefined ? (queryParams.isExpenseFilter ? "Wydatki" : "Przychody") : "Rodzaj transakcji" }</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={"__NONE__"}>Wszystkie</SelectItem>
                            <SelectItem value={true.toString()}>Wydatki</SelectItem>
                            <SelectItem value={false.toString()}>Przychody</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Input type="number" placeholder="Kwota od" className="w-[120px] bg-background" value={queryParams.amountFromFilter?.toString() ?? ""} onChange={e => {
                    const amount = Number(e.target.value);
                    if (amount > 10_000_000 || amount < 0)
                        return;
                    setQueryParams(prevState => ({...prevState, amountFromFilter: amount != 0 ? amount : undefined}));
                }}
                ></Input>
                <Input type="number" placeholder="Kwota do" className="w-[120px] bg-background" value={queryParams.amountToFilter?.toString() ?? ""} onChange={e => {
                    const amount = Number(e.target.value);
                    if (amount > 10_000_000 || amount < 0)
                        return;
                    setQueryParams(prevState => ({...prevState, amountToFilter: amount != 0 ? amount : undefined}));
                }}
                ></Input>
                <Autocomplete className="bg-background"
                              fetchSuggestions={async input => (vendorsQuery.data || []).filter(o =>
                                  o.name.toLowerCase().includes(input.toLowerCase()))}
                              value={vendorFilter?.name} clearQueryAfterSelection={false}
                              onChange={value => {
                                  if (value?.id) {
                                      const selectedVendor = vendorsQuery.data?.find(v => v.id === value.id)
                                      setVendorFilter(selectedVendor);
                                      setQueryParams(prevState => ({...prevState, vendorIdFilter: selectedVendor?.id}));
                                  } else {
                                      setVendorFilter(undefined);
                                      setQueryParams(prevState => ({...prevState, vendorIdFilter: undefined}));
                                  }
                              }} allowCustomValues={false} placeholder="Sprzedawca"/>
                <Select onValueChange={(value) => {
                    if (value == "__NONE__") {
                        setQueryParams(prevState => ({...prevState, subcategoryIdFilter: undefined}));
                    } else if (value) {
                        setQueryParams(prevState => ({...prevState, subcategoryIdFilter: Number(value)}));
                    } else {
                        setQueryParams(prevState => ({...prevState, subcategoryIdFilter: undefined}));
                    }
                }}
                        value={(queryParams.subcategoryIdFilter) ? queryParams.subcategoryIdFilter.toString() : "__NONE__"}>
                    <SelectTrigger className={`bg-background ${!queryParams.subcategoryIdFilter ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{ queryParams.subcategoryIdFilter ? subcategoriesQuery.data?.get(queryParams.subcategoryIdFilter.valueOf()) : "Kategoria" }</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__NONE__">Wszystkie</SelectItem>
                        {categoriesQuery.data && categoriesQuery.data.map(category => (
                            <SelectGroup key={category.id}>
                                <SelectLabel>{category.name}</SelectLabel>
                                {category.subcategories.map(subcategory => 
                                    (<SelectItem key={subcategory.id} value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {(transactionsQuery.isLoading || vendorsQuery.isLoading || subcategoriesQuery.isLoading || tagsQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(transactionsQuery.isError || vendorsQuery.isError || subcategoriesQuery.isError || tagsQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {transactionsQuery.data && vendorsQuery.data && subcategoriesQuery.data && tagsQuery.data &&
                <TransactionsTable
                    transactions={transactionsQuery.data} vendors={vendorsQuery.data}
                    subcategories={subcategoriesQuery.data} tags={tagsQuery.data}
                    onEditClick={t => setTransactionToEdit(t)} onDeleteClick={t => setTransactionToRemove(t)}/>
            }
        </div>
    )
}