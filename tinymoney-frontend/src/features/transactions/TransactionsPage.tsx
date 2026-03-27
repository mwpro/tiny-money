import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {
    type SuggestedAlias,
    type Tag,
    type Transaction,
    type TransactionQueryParams,
} from "@/api/ApiTypes.ts"
import {useEffect, useState} from "react";
import {TransactionRemovalDialog} from "@/features/transactions/TransactionRemovalDialog.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {SplitTransactionDialog} from "@/features/transactions/SplitTransactionDialog.tsx";
import {AliasProposalDialog} from "@/features/transactions/transactions-editor/AliasProposalDialog.tsx";
import {ImportBankStatementDialog} from "@/features/transactions/ImportBankStatementDialog.tsx";
import {BulkTransactionRemovalDialog} from "@/features/transactions/BulkTransactionRemovalDialog.tsx";
import {MergeTransactionsDialog} from "@/features/transactions/MergeTransactionsDialog.tsx";
import {SelectionSummaryBar} from "@/features/transactions/SelectionSummaryBar.tsx";
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
import {toast} from "sonner";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {AlertCircleIcon, Diff, Minus, Plus, ShieldQuestionMark} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {dateFormat, prepareTitleText} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";

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
        isVerifiedFilter: searchParams.get("isVerified") != null ? searchParams.get("isVerified") == "true" : undefined,
    };
}

export function TransactionsPage() {
    const { transactionsClient, vendorsClient, categoriesClient, tagsClient } = useApiClient();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [transactionToSplit, setTransactionToSplit] = useState<Transaction | undefined>(undefined)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [mergeOpen, setMergeOpen] = useState(false)
    const [pendingAlias, setPendingAlias] = useState<SuggestedAlias | null>(null)
    const [pendingDescription, setPendingDescription] = useState<string | undefined>(undefined)
    const [pendingVendorName, setPendingVendorName] = useState<string>("")
    const [queryParams, setQueryParams] = useState<TransactionQueryParams>(() => buildTransactionQueryParamsFromSearchParams(searchParams)); 
    const [vendorFilter, setVendorFilter] = useState<{ id: number; name: string } | undefined>(() => searchParams.get("vendorId") ? {
        id: Number(searchParams.get("vendorId")),
        name: "",
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
        queryFn: () => transactionsClient.getTransactions(debouncedQueryParams),        
        enabled: () => !!((debouncedQueryParams.dateFrom && debouncedQueryParams.dateTo)
            || debouncedQueryParams.amountFromFilter || debouncedQueryParams.amountToFilter || debouncedQueryParams.vendorIdFilter || debouncedQueryParams.subcategoryIdFilter
            || debouncedQueryParams.tagIdFilter || debouncedQueryParams.isVerifiedFilter !== undefined)
    })

    useEffect(() => {
            const {dateFrom, dateTo, isExpenseFilter, vendorIdFilter, subcategoryIdFilter, amountFromFilter, amountToFilter, tagIdFilter, isVerifiedFilter} = debouncedQueryParams;
            setSearchParams((params) => {
                dateFrom ? params.set("dateFrom", format(dateFrom, dateFormat)) : params.delete("dateFrom");
                dateTo ? params.set("dateTo", format(dateTo, dateFormat)) : params.delete("dateTo");
                isExpenseFilter != undefined ? params.set("isExpense", isExpenseFilter.toString()) : params.delete("isExpense");
                amountFromFilter ? params.set("amountFrom", amountFromFilter.toString()) : params.delete("amountFrom");
                amountToFilter ? params.set("amountTo", amountToFilter.toString()) : params.delete("amountTo");
                vendorIdFilter ? params.set("vendorId", vendorIdFilter.toString()) : params.delete("vendorId");
                subcategoryIdFilter ? params.set("subcategoryId", subcategoryIdFilter.toString()) : params.delete("subcategoryId");
                tagIdFilter ? params.set("tagId", tagIdFilter.toString()) : params.delete("tagId");
                isVerifiedFilter != undefined ? params.set("isVerified", isVerifiedFilter.toString()) : params.delete("isVerified");
                return params;
            })
        },
        [debouncedQueryParams]);


    useEffect(() => {
        setQueryParams(buildTransactionQueryParamsFromSearchParams(searchParams));
    }, [searchParams]);

    const verifyMutation = useMutation({
        mutationFn: (t: Transaction) => transactionsClient.verifyTransaction(t.id),
        onSuccess: (data, t) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            if (data.suggestedAlias) {
                setPendingAlias(data.suggestedAlias)
                setPendingDescription(t.description ?? undefined)
                setPendingVendorName(t.vendorName ?? "")
            }
        },
        onError: (error: Error) => toast.error('Błąd: ' + error.message),
    })

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const vendorByIdQuery = useQuery({
        queryKey: ['vendor', queryParams.vendorIdFilter],
        queryFn: () => vendorsClient.getVendor(queryParams.vendorIdFilter!),
        enabled: !!queryParams.vendorIdFilter && !vendorFilter?.name,
        ...dictionariesConfig
    })
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesClient.getCategories(),
        ...dictionariesConfig
    })
    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => tagsClient.getTags(),
        ...dictionariesConfig
    })

    useEffect(() => {
        if (vendorByIdQuery.data && queryParams.vendorIdFilter) {
            const { details } = vendorByIdQuery.data
            setVendorFilter({ id: details.id, name: details.name })
        }
    }, [vendorByIdQuery.data, queryParams.vendorIdFilter]);
    
    useEffect(() => {
        if (tagsQuery.data && queryParams.tagIdFilter) {
            const selectedTag = tagsQuery.data?.find(v => v.id === queryParams.tagIdFilter)
            setTagFilter(selectedTag)
        }
    }, [tagsQuery.data, queryParams.tagIdFilter]);

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Transakcje - ${dateRangeDescription}`)}</title>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold font-serif">Lista transakcji</h1>
                <div className="flex gap-2">
                    <ImportBankStatementDialog />
                    <TransactionsEditorDialog transactionToEdit={transactionToEdit} onClose={() => setTransactionToEdit(undefined)} />
                </div>
                <TransactionRemovalDialog transactionToRemove={transactionToRemove} onClose={() => setTransactionToRemove(undefined)} />
                <SplitTransactionDialog transaction={transactionToSplit} onClose={() => setTransactionToSplit(undefined)} />
                <AliasProposalDialog
                    suggestedAlias={pendingAlias}
                    transactionDescription={pendingDescription}
                    vendorName={pendingVendorName}
                    onClose={() => { setPendingAlias(null); setPendingDescription(undefined); setPendingVendorName("") }}
                />
                <BulkTransactionRemovalDialog
                    transactionIds={Array.from(selectedIds)}
                    isOpen={bulkDeleteOpen}
                    onClose={() => setBulkDeleteOpen(false)}
                    onSuccess={() => setSelectedIds(new Set())}
                />
                <MergeTransactionsDialog
                    open={mergeOpen}
                    selectedIds={selectedIds}
                    transactions={transactionsQuery.data?.transactions ?? []}
                    onClose={() => setMergeOpen(false)}
                    onSuccess={() => { setMergeOpen(false); setSelectedIds(new Set()) }}
                />
            </div>

            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <div className="w-full md:w-auto">
                    <DateRangePicker dateFrom={queryParams.dateFrom} dateTo={queryParams.dateTo} onChange={(dateFrom, dateTo) => {
                        setQueryParams(prevState => ({...prevState, dateFrom, dateTo}));
                    }} onRangeDescriptionChange={description => setDateRangeDescription(description)} presets={transactionsListPresets} monthYearMode={false} />
                </div>
                <ButtonGroup>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={queryParams.isExpenseFilter !== undefined ? "default" : "outline"} onClick={() => {
                                setQueryParams(prevState => ({...prevState,
                                    isExpenseFilter:
                                        prevState.isExpenseFilter === undefined ? true
                                            : (prevState.isExpenseFilter ? false : undefined)

                                }))
                            }} >
                                {queryParams.isExpenseFilter == undefined && (<Diff />)}
                                {queryParams.isExpenseFilter == false && (<Plus />)}
                                {queryParams.isExpenseFilter == true && (<Minus />)}
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

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={queryParams.isVerifiedFilter === false ? "default" : "outline"}
                                onClick={() => setQueryParams(prevState => ({
                                    ...prevState,
                                    isVerifiedFilter: prevState.isVerifiedFilter === false ? undefined : false
                                }))}
                            >
                                <ShieldQuestionMark />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side={"bottom"}>
                            <p>
                                {queryParams.isVerifiedFilter == undefined && ("Zweryfikowane i niezweryfikowane")}
                                {queryParams.isVerifiedFilter == false && ("Tylko niezweryfikowane")}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </ButtonGroup>
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

                <Autocomplete className="bg-background w-full md:w-auto md:flex-1"
                              fetchSuggestions={async input => {
                                  const suggestions = await vendorsClient.autocompleteVendors(input);
                                  return suggestions.map(s => ({ id: s.vendorId, name: s.vendorName }));
                              }}
                              value={vendorFilter?.name} clearQueryAfterSelection={false}
                              onChange={value => {
                                  if (value?.id) {
                                      setVendorFilter({ id: value.id, name: value.name });
                                      setQueryParams(prevState => ({...prevState, vendorIdFilter: value.id}));
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
                    <SelectTrigger className={`bg-background w-full md:w-auto md:flex-1 ${!queryParams.subcategoryIdFilter ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{(() => {
                            if (!queryParams.subcategoryIdFilter) return "Kategoria";
                            const selectedCategory = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === queryParams.subcategoryIdFilter));
                            return selectedCategory
                                ? `${selectedCategory.name} / ${selectedCategory.subcategories.find(s => s.id === queryParams.subcategoryIdFilter)!.name}`
                                : "Kategoria";
                        })()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__NONE__">Wszystkie</SelectItem>
                        {categoriesQuery.data && categoriesQuery.data
                            .filter(c => (queryParams.isExpenseFilter === undefined || queryParams.isExpenseFilter == !c.isIncome))
                            .map(category => (
                            <SelectGroup key={category.id}>
                                <SelectLabel>{category.name}</SelectLabel>
                                {category.subcategories.map(subcategory =>
                                    (<SelectItem key={subcategory.id} value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                <Autocomplete className="bg-background w-full md:w-auto md:flex-1"
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
            {transactionsQuery.isLoading &&
                <div className="p-10">Ładowanie danych...</div>}
            {transactionsQuery.isError &&
                <div className="p-10 text-destructive">Błąd ładowania danych</div>}
            {transactionsQuery.data &&
                <TransactionsTable
                    transactions={transactionsQuery.data}
                    onEditClick={t => setTransactionToEdit(t)} onDeleteClick={t => setTransactionToRemove(t)}
                    onSplitClick={t => setTransactionToSplit(t)}
                    selectedIds={selectedIds} onSelectionChange={setSelectedIds}
                    onVerifyClick={t => verifyMutation.mutate(t)}
                    verifyingTransactionId={verifyMutation.isPending ? verifyMutation.variables?.id : undefined}
                    onVendorFilterClick={vendor => {
                        setVendorFilter(vendor);
                        setQueryParams(prev => ({ ...prev, vendorIdFilter: vendor.id }));
                    }}
                    onSubcategoryFilterClick={subcategoryId => {
                        setQueryParams(prev => ({ ...prev, subcategoryIdFilter: subcategoryId }));
                    }}
                    onTagFilterClick={tag => {
                        setTagFilter(tagsQuery.data?.find(t => t.id === tag.id));
                        setQueryParams(prev => ({ ...prev, tagIdFilter: tag.id }));
                    }}/>
            }
            {transactionsQuery.data && selectedIds.size > 0 && (
                <SelectionSummaryBar
                    selectedIds={selectedIds}
                    transactions={transactionsQuery.data.transactions}
                    onDelete={() => setBulkDeleteOpen(true)}
                    onMerge={() => setMergeOpen(true)}
                />
            )}
        </div>
    )
}