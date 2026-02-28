import {useQuery} from "@tanstack/react-query"
import {
    type Tag,
    type Transaction,
    type TransactionQueryParams,
    type Vendor
} from "@/api/ApiTypes.ts"
import {useEffect, useState} from "react";
import {TransactionRemovalDialog} from "@/features/transactions/TransactionRemovalDialog.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {DateRangePicker, transactionsListPresets} from "@/components/DateRangePicker.tsx";
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
import {AlertCircleIcon, Diff, Minus, Plus} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {dateFormat, prepareTitleText} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

function buildTransactionQueryParamsFromSearchParams(searchParams: URLSearchParams) : TransactionQueryParams {
    return {
        dateFrom: searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, dateFormat, new Date()) : undefined,
        dateTo: searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, dateFormat, new Date()) : undefined,
        isExpenseFilter: searchParams.get("isExpense") != undefined ? searchParams.get("isExpense") == "true" : undefined,
        amountFromFilter: searchParams.get("amountFrom") ? Number(searchParams.get("amountFrom")) : undefined,
        amountToFilter: searchParams.get("amountTo") ? Number(searchParams.get("amountTo")) : undefined,
        subcategoryIdFilter: searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined,
        vendorIdFilter: searchParams.get("vendorId") ? Number(searchParams.get("vendorId")) : undefined,
        tagIdFilter: searchParams.get("tagId") ? Number(searchParams.get("tagId")) : undefined,
    };
}

export function TransactionsPage() {
    const apiClient = useApiClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [queryParams, setQueryParams] = useState<TransactionQueryParams>(() => buildTransactionQueryParamsFromSearchParams(searchParams)); 
    const [vendorFilter, setVendorFilter] = useState<Vendor | undefined>(() => searchParams.get("vendorId") ? {
        id: Number(searchParams.get("vendorId")),
        name: "",
        defaultSubcategoryId: 0
    } : undefined);
    const [tagFilter, setTagFilter] = useState<Tag | undefined>(() => searchParams.get("tagId") ? {
        id: Number(searchParams.get("tagId")),
        name: "",
        numberOfTransactions: 0
    } : undefined);
    const [dateRangeDescription, setDateRangeDescription] = useState<string>("")
    
    const [debouncedQueryParams] = useDebouncedValue(queryParams, {
        wait: 500
    });
    
    const transactionsQuery = useQuery({
        queryKey: ['transactions', debouncedQueryParams],
        queryFn: () => apiClient.getTransactions(debouncedQueryParams),        
        enabled: () => !!((debouncedQueryParams.dateFrom && debouncedQueryParams.dateTo) 
            || debouncedQueryParams.amountFromFilter || debouncedQueryParams.amountToFilter || debouncedQueryParams.vendorIdFilter || debouncedQueryParams.subcategoryIdFilter
            || debouncedQueryParams.tagIdFilter)
    })

    useEffect(() => {
            const {dateFrom, dateTo, isExpenseFilter, vendorIdFilter, subcategoryIdFilter, amountFromFilter, amountToFilter, tagIdFilter} = debouncedQueryParams;
            setSearchParams((params) => {
                dateFrom ? params.set("dateFrom", format(dateFrom, dateFormat)) : params.delete("dateFrom");
                dateTo ? params.set("dateTo", format(dateTo, dateFormat)) : params.delete("dateTo");
                isExpenseFilter != undefined ? params.set("isExpense", isExpenseFilter.toString()) : params.delete("isExpense");
                amountFromFilter ? params.set("amountFrom", amountFromFilter.toString()) : params.delete("amountFrom");
                amountToFilter ? params.set("amountTo", amountToFilter.toString()) : params.delete("amountTo");
                vendorIdFilter ? params.set("vendorId", vendorIdFilter.toString()) : params.delete("vendorId");
                subcategoryIdFilter ? params.set("subcategoryId", subcategoryIdFilter.toString()) : params.delete("subcategoryId");
                tagIdFilter ? params.set("tagId", tagIdFilter.toString()) : params.delete("tagId");
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
        queryFn: () => apiClient.getVendors(),
        ...dictionariesConfig
    })
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.getCategories(),
        ...dictionariesConfig
    })
    const subcategoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.getCategories(),
        select: data => (new Map<number, string>(data.flatMap(c => c.subcategories.map(s => ([s.id, `${c.name} / ${s.name}`]))))),
        ...dictionariesConfig
    })
    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => apiClient.getTags(),
        ...dictionariesConfig
    })

    useEffect(() => {
        if (vendorsQuery.data && queryParams.vendorIdFilter) {
            const selectedVendor = vendorsQuery.data?.find(v => v.id === queryParams.vendorIdFilter)
            setVendorFilter(selectedVendor)
        }
    }, [vendorsQuery.data, queryParams.vendorIdFilter]);
    
    useEffect(() => {
        if (tagsQuery.data && queryParams.tagIdFilter) {
            const selectedTag = tagsQuery.data?.find(v => v.id === queryParams.tagIdFilter)
            setTagFilter(selectedTag)
        }
    }, [tagsQuery.data, queryParams.tagIdFilter]);

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Transakcje - ${dateRangeDescription}`)}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Lista transakcji</h1>
                <TransactionsEditorDialog transactionToEdit={transactionToEdit} onClose={() => setTransactionToEdit(undefined)} />
                <TransactionRemovalDialog transactionToRemove={transactionToRemove}/>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <DateRangePicker dateFrom={queryParams.dateFrom} dateTo={queryParams.dateTo} onChange={(dateFrom, dateTo) => {
                    setQueryParams(prevState => ({...prevState, dateFrom, dateTo}));
                }} onRangeDescriptionChange={description => setDateRangeDescription(description)} presets={transactionsListPresets} monthYearMode={false} />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant={"outline"} onClick={() => {
                            setQueryParams(prevState => ({...prevState,
                                isExpenseFilter:
                                    prevState.isExpenseFilter === undefined ? true
                                        : (prevState.isExpenseFilter ? false : undefined)

                            }))
                        }} >
                            {queryParams.isExpenseFilter == undefined && (<Diff />)}
                            {queryParams.isExpenseFilter == false && (<Plus className={"text-green-600"} />)}
                            {queryParams.isExpenseFilter == true && (<Minus className={"text-red-600"} />)}
                        </Button>                        
                    </TooltipTrigger>
                    <TooltipContent side={"bottom"}>
                        <p>
                            {queryParams.isExpenseFilter == undefined && ("Przychody i wydatki")}
                            {queryParams.isExpenseFilter == false && ("Przychody")}
                            {queryParams.isExpenseFilter == true && ("Wydatki")}
                        </p>
                    </TooltipContent>
                </Tooltip>
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
                              }} allowCustomValues={false} placeholder="Sprzedawca" deletable />
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
                        {categoriesQuery.data && categoriesQuery.data
                            .filter(c => queryParams.isExpenseFilter === undefined || queryParams.isExpenseFilter == !c.isIncome )
                            .map(category => (
                            <SelectGroup key={category.id}>
                                <SelectLabel>{category.name}</SelectLabel>
                                {category.subcategories.map(subcategory => 
                                    (<SelectItem key={subcategory.id} value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                <Autocomplete className="bg-background grow"
                              fetchSuggestions={async input => (tagsQuery.data || []).filter(o =>
                                  o.name.toLowerCase().includes(input.toLowerCase()))}
                              value={tagFilter?.name} clearQueryAfterSelection={false}
                              onChange={value => {
                                  if (value?.id) {
                                      const selectedTag = tagsQuery.data?.find(t => t.id === value.id)
                                      setTagFilter(selectedTag);
                                      setQueryParams(prevState => ({...prevState, tagIdFilter: selectedTag?.id}));
                                  } else {
                                      setTagFilter(undefined);
                                      setQueryParams(prevState => ({...prevState, tagIdFilter: undefined}));
                                  }
                              }} allowCustomValues={false} placeholder="Tag" deletable />
            </div>

            {(!transactionsQuery.isEnabled && <Alert  className="mb-6" variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Doprecyzuj filtry.</AlertTitle>
                <AlertDescription>
                    <p>Parametry wyszukiwania są zbyt ogólne</p>
                    <ul className="list-inside list-disc text-sm">
                        <li>Wskaż zakres dat do przeszukania</li>
                        <li>lub uzupełnij filtry kwoty/sprzedawcy/kategorii/tagu</li>
                    </ul>
                </AlertDescription>
            </Alert>)}
            {(transactionsQuery.data?.transactions.length == 1000 && <Alert className="mb-6" variant="destructive">
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