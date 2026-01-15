import {useQuery} from "@tanstack/react-query"
import {
    getCategories, getTags, getTransactions, getVendors, type Transaction, type Vendor
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


export function TransactionsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)
    const [dateFrom, setDateFrom] = useState<Date>(() => searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, "yyyy-MM-dd", new Date()) : startOfMonth(new Date()));
    const [dateTo, setDateTo] = useState<Date>(() => searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, "yyyy-MM-dd", new Date()) : endOfMonth(new Date()));
    const [isExpenseFilter, setIsExpenseFilter] = useState<boolean | undefined>(() => searchParams.get("isExpense") != undefined ? searchParams.get("isExpense") == "true" : undefined);
    const [amountFromFilter, setAmountFromFilter] = useState<Number | undefined>(() => searchParams.get("amountFrom") ? Number(searchParams.get("amountFrom")) : undefined);
    const [amountToFilter, setAmountToFilter] = useState<Number | undefined>(() => searchParams.get("amountTo") ? Number(searchParams.get("amountTo")) : undefined);
    const [vendorFilter, setVendorFilter] = useState<Vendor | undefined>(() => searchParams.get("vendorId") ? {
        id: Number(searchParams.get("vendorId")),
        name: "",
        defaultSubcategoryId: 0
    } : undefined);
    const [subcategoryIdFilter, setSubcategoryIdFilter] = useState<Number | undefined>(() => searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined);

    const transactionsQuery = useQuery({
        queryKey: ['transactions', dateFrom, dateTo, isExpenseFilter, vendorFilter?.id, subcategoryIdFilter, amountFromFilter, amountToFilter],
        queryFn: () => getTransactions(auth, dateFrom, dateTo, isExpenseFilter, amountFromFilter, amountToFilter, vendorFilter?.id, subcategoryIdFilter),
    })

    useEffect(() => {
            setSearchParams((params) => {
                params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
                params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
                isExpenseFilter != undefined ? params.set("isExpense", isExpenseFilter.toString()) : params.delete("isExpense");
                amountFromFilter ? params.set("amountFrom", amountFromFilter.toString()) : params.delete("amountFrom");
                amountToFilter ? params.set("amountTo", amountToFilter.toString()) : params.delete("amountTo");
                vendorFilter ? params.set("vendorId", vendorFilter.id.toString()) : params.delete("vendorId");
                subcategoryIdFilter ? params.set("subcategoryId", subcategoryIdFilter.toString()) : params.delete("subcategoryId");
                return params;
            })
        },
        [dateFrom, dateTo, isExpenseFilter, vendorFilter, subcategoryIdFilter, amountFromFilter, amountToFilter]);

    useEffect(() => {
            if (!searchParams.size) {
                setDateFrom(startOfMonth(new Date()));
                setDateTo(endOfMonth(new Date()));
                setIsExpenseFilter(undefined);
                setAmountFromFilter(undefined);
                setAmountToFilter(undefined);
                setSubcategoryIdFilter(undefined);
                setVendorFilter(undefined);
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
        if (vendorsQuery.data && vendorFilter && !vendorFilter.name) {
            const selectedVendor = vendorsQuery.data?.find(v => v.id === vendorFilter.id)
            setVendorFilter(selectedVendor)
        }
    }, [vendorsQuery.data, vendorFilter]);

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
                <Select value={isExpenseFilter?.toString() ?? "__NONE__"}
                        onValueChange={val => {
                            switch (val) {
                                case true.toString():
                                    setIsExpenseFilter(true);
                                    break;
                                case false.toString():
                                    setIsExpenseFilter(false);
                                    break;
                                default:
                                    setIsExpenseFilter(undefined);
                                    break;
                            }
                        }}>
                    <SelectTrigger className={`w-[150px] bg-background ${isExpenseFilter == undefined ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{ isExpenseFilter != undefined ? (isExpenseFilter == true ? "Wydatki" : "Przychody") : "Rodzaj transakcji" }</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={"__NONE__"}>Wszystkie</SelectItem>
                            <SelectItem value={true.toString()}>Wydatki</SelectItem>
                            <SelectItem value={false.toString()}>Przychody</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Input type="number" placeholder="Kwota od" className="w-[120px] bg-background" value={amountFromFilter?.toString() ?? ""} onChange={e => {
                    const amount = Number(e.target.value);
                    if (amount > 10_000_000 || amount < 0)
                        return;
                    setAmountFromFilter(amount != 0 ? amount : undefined);
                }}
                ></Input>
                <Input type="number" placeholder="Kwota do" className="w-[120px] bg-background" value={amountToFilter?.toString() ?? ""} onChange={e => {
                    const amount = Number(e.target.value);
                    if (amount > 10_000_000 || amount < 0)
                        return;
                    setAmountToFilter(amount != 0 ? amount : undefined);
                }}
                ></Input>
                <Autocomplete className="bg-background"
                              fetchSuggestions={async input => (vendorsQuery.data || []).filter(o =>
                                  o.name.toLowerCase().includes(input.toLowerCase()))}
                              value={vendorFilter?.name} clearQueryAfterSelection={false}
                              onChange={value => {
                                  if (value?.id) {
                                      const selectedVendor = vendorsQuery.data?.find(v => v.id === value.id)
                                      setVendorFilter(selectedVendor)
                                  } else {
                                      setVendorFilter(undefined);
                                  }
                              }} allowCustomValues={false} placeholder="Sprzedawca"/>
                <Select onValueChange={(value) => {
                    if (value == "__NONE__") {
                        setSubcategoryIdFilter(undefined);
                    } else if (value) {
                        setSubcategoryIdFilter(Number(value))
                    } else {
                        setSubcategoryIdFilter(undefined);
                    }
                }}
                        value={(subcategoryIdFilter) ? subcategoryIdFilter.toString() : "__NONE__"}>
                    <SelectTrigger className={`bg-background ${!subcategoryIdFilter ? "text-muted-foreground" : ""}`}>
                        <SelectValue>{ subcategoryIdFilter ? subcategoriesQuery.data?.get(subcategoryIdFilter.valueOf()) : "Kategoria" }</SelectValue>
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