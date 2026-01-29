import {useQuery} from "@tanstack/react-query"
import {
    getCategories, getTags, getTransactions, getVendors, type Transaction, type TransactionQueryParams, type Vendor
} from "@/lib/api"
import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useState} from "react";
import {TransactionRemovalDialog} from "@/features/transactions/TransactionRemovalDialog.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {DatePicker} from "@/components/DatePicker.tsx";
import {format, parse} from 'date-fns';
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
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {AlertCircleIcon} from "lucide-react";


function buildTransactionQueryParamsFromSearchParams(searchParams: URLSearchParams) : TransactionQueryParams {
    return {
        dateFrom: searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, "yyyy-MM-dd", new Date()) : undefined,
        dateTo: searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, "yyyy-MM-dd", new Date()) : undefined,
        isExpenseFilter: searchParams.get("isExpense") != undefined ? searchParams.get("isExpense") == "true" : undefined,
        amountFromFilter: searchParams.get("amountFrom") ? Number(searchParams.get("amountFrom")) : undefined,
        amountToFilter: searchParams.get("amountTo") ? Number(searchParams.get("amountTo")) : undefined,
        subcategoryIdFilter: searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined,
        vendorIdFilter: searchParams.get("vendorId") ? Number(searchParams.get("vendorId")) : undefined
    };
}

export function TransactionsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [queryParams, setQueryParams] = useState<TransactionQueryParams>(() => buildTransactionQueryParamsFromSearchParams(searchParams)); 
    const [vendorFilter, setVendorFilter] = useState<Vendor | undefined>(() => searchParams.get("vendorId") ? {
        id: Number(searchParams.get("vendorId")),
        name: "",
        defaultSubcategoryId: 0
    } : undefined);
   
    const [debouncedQueryParams] = useDebouncedValue(queryParams, {
        wait: 500
    });
    const transactionsQuery = useQuery({
        queryKey: ['transactions', debouncedQueryParams],
        queryFn: () => getTransactions(auth, debouncedQueryParams),
        
        enabled: () => !!((debouncedQueryParams.dateFrom && debouncedQueryParams.dateTo) 
            || debouncedQueryParams.amountFromFilter || debouncedQueryParams.amountToFilter || debouncedQueryParams.vendorIdFilter || debouncedQueryParams.subcategoryIdFilter)
    })

    useEffect(() => {
            const {dateFrom, dateTo, isExpenseFilter, vendorIdFilter, subcategoryIdFilter, amountFromFilter, amountToFilter} = debouncedQueryParams;
            setSearchParams((params) => {
                dateFrom ? params.set("dateFrom", format(dateFrom, "yyyy-MM-dd")) : params.delete("dateFrom");
                dateTo ? params.set("dateTo", format(dateTo, "yyyy-MM-dd")) : params.delete("dateTo");
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
        setQueryParams(buildTransactionQueryParamsFromSearchParams(searchParams));
    }, [searchParams]);

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
    }, [vendorsQuery.data, queryParams.vendorIdFilter]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Lista transakcji</h1>
                <TransactionsEditorDialog transactionToEdit={transactionToEdit} />
                <TransactionRemovalDialog transactionToRemove={transactionToRemove}/>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <DatePicker dateFrom={queryParams.dateFrom} dateTo={queryParams.dateTo} onChange={(dateFrom, dateTo) => {
                    setQueryParams(prevState => ({...prevState, dateFrom, dateTo}));
                }}/>
                <Select value={queryParams.isExpenseFilter?.toString() ?? "__NONE__"}
                        onValueChange={val => setQueryParams(prevState => ({
                            ...prevState,
                            isExpenseFilter: val === "__NONE__" ? undefined : val === 'true'
                        }))}>
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
                <Select onValueChange={(value) => setQueryParams(prevState => ({
                    ...prevState,
                    subcategoryIdFilter: !value || value === "__NONE__" ? undefined : Number(value)
                }))}
                        value={(queryParams.subcategoryIdFilter) ? queryParams.subcategoryIdFilter.toString() : "__NONE__"}>
                    <SelectTrigger className={`bg-background ${!queryParams.subcategoryIdFilter ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{ subcategoriesQuery.data && queryParams.subcategoryIdFilter ? subcategoriesQuery.data.get(queryParams.subcategoryIdFilter.valueOf()) : "Kategoria" }</SelectValue>
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

            {(!transactionsQuery.isEnabled && <Alert  className="mb-6" variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Doprecyzuj filtry.</AlertTitle>
                <AlertDescription>
                    <p>Parametry wyszukiwania są zbyt ogólne</p>
                    <ul className="list-inside list-disc text-sm">
                        <li>Wskaż zakres dat do przeszukania</li>
                        <li>lub uzupełnij filtry kwoty/sprzedawcy/kategorii</li>
                    </ul>
                </AlertDescription>
            </Alert>)}
            {(transactionsQuery.data?.length == 1000 && <Alert className="mb-6" variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Osiągnięto limit znalezionych transakcji.</AlertTitle>
                <AlertDescription>
                    <p>Maksymalna ilość znalezionych transakcji jest ograniczona do 1000. Spróbuj użyć bardziej precyzyjnych kryteriów.</p>
                </AlertDescription>
            </Alert>)}
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