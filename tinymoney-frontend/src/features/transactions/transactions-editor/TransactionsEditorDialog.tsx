import {useEffect, useRef, useState} from "react"
import {type Control, Controller, useForm, useWatch} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {z} from "zod"
import {
    type AiSuggestion,
    type NewTransaction,
    type SuggestedAlias,
    type Transaction,
    type TransactionMutationResponse,
    type VendorSuggestion
} from "@/api/ApiTypes.ts"

import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {toast} from "sonner";
import {TagsInput} from "@/components/TagsInput.tsx";
import Autocomplete from "@/components/Autocomplete.tsx";
import {transactionSchema} from "@/features/transactions/transactions-editor/TransactionSchema.ts";
import {format} from "date-fns";
import {Textarea} from "@/components/ui/textarea.tsx";
import {
    ParsedDescription,
    type WithDescription
} from "@/features/transactions/transactions-editor/ParsedDescription.tsx";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText} from "@/components/ui/input-group.tsx";
import {AlertTriangle, Loader2, Minus, Plus, Sparkles} from "lucide-react";
import {DatePicker} from "@/components/DatePicker.tsx";
import {dateFormat} from "@/lib/utils.ts";
import {visibleCategories} from "@/lib/categories.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {Alert, AlertDescription} from "@/components/ui/alert.tsx";
import {AliasProposalDialog} from "@/features/transactions/transactions-editor/AliasProposalDialog.tsx";

export type TransactionFormValues = z.infer<typeof transactionSchema>

function AiSuggestionMarker() {
    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Wartość zasugerowana przez AI">
            <Sparkles className="h-3 w-3"/> Sugestia AI
        </span>
    )
}

interface TransactionEditorDialogProps {
    transactionToEdit?: Transaction,
    onClose?: () => void,
    onTransactionSaved?: () => void
}

export function TransactionsEditorDialog({transactionToEdit, onClose, onTransactionSaved}: TransactionEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [pendingAlias, setPendingAlias] = useState<SuggestedAlias | null>(null)
    const [pendingDescription, setPendingDescription] = useState<string | undefined>(undefined)
    const [pendingVendorName, setPendingVendorName] = useState<string>("")
    const lastVendorSuggestions = useRef<VendorSuggestion[]>([])
    const filledForTransactionId = useRef<number | null>(null)
    const [requestedAiSuggestion, setRequestedAiSuggestion] = useState<{ transactionId: number, suggestion: AiSuggestion } | null>(null)
    const queryClient = useQueryClient()
    const { transactionsClient, vendorsClient, categoriesClient, tagsClient } = useApiClient();

    const transactionQuery = useQuery({
        queryKey: ['transaction', transactionToEdit?.id],
        queryFn: () => transactionsClient.getTransaction(transactionToEdit!.id),
        enabled: !!transactionToEdit,
        gcTime: 0,
        refetchOnWindowFocus: false,
    })
    const transaction = transactionToEdit ? transactionQuery.data : undefined
    const isLoadingTransaction = !!transactionToEdit && !transaction
    const canUseAiSuggestions = !!transaction && !transaction.isVerified;

    useEffect(() => {
        setIsOpen(!!transactionToEdit);
    }, [transactionToEdit]);

    useEffect(() => {
        !isOpen && onClose && onClose();
    }, [isOpen]);

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}

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

    const {register, control, handleSubmit, setValue, formState: {errors, defaultValues}, getValues, reset, setFocus} = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: transactionToEdit?.amount || null,
            description: "",
            isExpense: true,
            transactionDate: format(new Date(), dateFormat),
            subcategoryId: 0,
            vendor: {id: undefined, name: ""},
            tags: []
        }
    })

    // Expenses must stay in expense categories and incomes in income ones, so a category not matching the new sign is cleared
    const setDirection = (isExpense: boolean) => {
        setValue("isExpense", isExpense, {shouldValidate: true, shouldDirty: true})
        const subcategoryId = getValues("subcategoryId")
        const isIncomeCategory = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === subcategoryId))?.isIncome
        if (isIncomeCategory === isExpense) {
            setValue("subcategoryId", 0, {shouldDirty: true})
        }
    }

    const isConfidentAiSuggestion = (suggestion: AiSuggestion) => !!suggestion.subcategoryId || suggestion.vendorId !== null

    const applyAiSuggestion = (suggestion: AiSuggestion, overwrite: boolean) => {
        const overwriteVendor = overwrite && suggestion.vendorId !== null
        if (suggestion.vendorName && (overwriteVendor || !getValues("vendor").name)) {
            setValue("vendor", {id: suggestion.vendorId ?? undefined, name: suggestion.vendorName}, {shouldValidate: true, shouldDirty: true})
        }
        if (suggestion.subcategoryId && (overwrite || !getValues("subcategoryId"))) {
            setValue("subcategoryId", suggestion.subcategoryId, {shouldValidate: true, shouldDirty: true})
        }
    }

    useEffect(() => {
        if (!transactionToEdit) {
            reset()
            filledForTransactionId.current = null
        }
    }, [transactionToEdit]);

    useEffect(() => {
        if (!transaction || filledForTransactionId.current === transaction.id) return
        filledForTransactionId.current = transaction.id

        setValue("amount", transaction.amount)
        setValue("description", transaction.description ?? "")
        setValue("isExpense", transaction.isExpense);
        setValue("transactionDate", format(transaction.transactionDate, dateFormat));
        if (transaction.subcategoryId !== null) {
            setValue("subcategoryId", transaction.subcategoryId);
        }
        if (transaction.vendorId !== null && transaction.vendorName !== null) {
            setValue("vendor", { id: transaction.vendorId, name: transaction.vendorName });
        }
        const selectedTags = tagsQuery.data?.filter(t => transaction.tags.some(tt => tt.id === t.id));
        if (selectedTags) {
            setValue("tags", selectedTags);
        }

        if (transaction.aiSuggestion) {
            applyAiSuggestion(transaction.aiSuggestion, false)
        }
    }, [transaction]); // eslint-disable-line react-hooks/exhaustive-deps

    const aiSuggestionMutation = useMutation({
        mutationFn: () => transactionsClient.createAiSuggestion(transactionToEdit!.id),
        onSuccess: (suggestion: AiSuggestion | null) => {
            if (suggestion) {
                setRequestedAiSuggestion({transactionId: transactionToEdit!.id, suggestion})
            }
            if (!suggestion || !isConfidentAiSuggestion(suggestion)) {
                toast.info("AI nie ma pewnej sugestii dla tej transakcji")
                return
            }
            applyAiSuggestion(suggestion, true)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })
    const aiRequested = !!transactionToEdit && requestedAiSuggestion?.transactionId === transactionToEdit.id
    const aiSuggestion = aiRequested ? requestedAiSuggestion!.suggestion : transaction?.aiSuggestion ?? null
    const vendorValue = useWatch({control, name: "vendor"})
    const subcategoryValue = useWatch({control, name: "subcategoryId"})
    const transactionDateValue = useWatch({control, name: "transactionDate"})
    const vendorFromAi = canUseAiSuggestions && !!aiSuggestion?.vendorName
        && vendorValue.name === aiSuggestion.vendorName
        && (vendorValue.id ?? null) === aiSuggestion.vendorId
        && (aiRequested || transaction?.vendorId === null)
    const subcategoryFromAi = canUseAiSuggestions && !!aiSuggestion?.subcategoryId
        && subcategoryValue === aiSuggestion.subcategoryId
        && (aiRequested || transaction?.subcategoryId === null)

    const mutation = useMutation({
        mutationFn: (newTransaction: NewTransaction) => transactionToEdit
            ? transactionsClient.editTransaction(transactionToEdit.id, newTransaction)
            : transactionsClient.addTransaction(newTransaction),
        onSuccess: (data: TransactionMutationResponse) => {
            if (data.newVendor) {
                queryClient.invalidateQueries({queryKey: ['vendors-details']})
            }
            if (data.newTags?.length) {
                queryClient.invalidateQueries({queryKey: ['tags']})
            }
            queryClient.invalidateQueries({queryKey: ['transactions']})
            onTransactionSaved && onTransactionSaved()
            if (transactionToEdit) {
                if (data.suggestedAlias) {
                    setPendingAlias(data.suggestedAlias)
                    setPendingDescription(transaction?.description)
                    setPendingVendorName(getValues("vendor").name)
                }
                reset();
                setIsOpen(false);
            } else {
                setFocus("transactionDate")
                reset({...defaultValues, transactionDate: getValues("transactionDate")})
            }
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: TransactionFormValues) => {
        mutation.mutate(data)
    }
    return (
        <>
        <AliasProposalDialog
            suggestedAlias={pendingAlias}
            transactionDescription={pendingDescription}
            vendorName={pendingVendorName}
            onClose={() => { setPendingAlias(null); setPendingDescription(undefined); setPendingVendorName("") }}
        />
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            reset();
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj Transakcję</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{transactionToEdit ? "Edytuj transakcję" : "Dodaj nową transakcję"}</DialogTitle>
                    <DialogDescription>
                        {transactionToEdit ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane transakcji i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="relative">
                    {/* The fields stay laid out (just invisible) while loading, so the dialog doesn't change size */}
                    {isLoadingTransaction && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center text-muted-foreground">
                            {transactionQuery.isError
                                ? "Nie udało się wczytać transakcji"
                                : <Loader2 className="h-6 w-6 animate-spin"/>}
                        </div>
                    )}
                    <div className={`grid gap-4 -mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 ${isLoadingTransaction ? "invisible" : ""}`}>

                        {transaction && (!transaction.isVerified || transaction.isPossibleDuplicate) && (
                            <Alert variant="default" className="border-amber-400">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-amber-700">
                                    {!transaction.isVerified && transaction.isPossibleDuplicate
                                        ? "Ta transakcja nie została jeszcze zweryfikowana i może być duplikatem istniejącej transakcji."
                                        : !transaction.isVerified
                                            ? "Ta transakcja nie została jeszcze zweryfikowana."
                                            : "Ta transakcja może być duplikatem istniejącej transakcji."
                                    }
                                </AlertDescription>
                            </Alert>
                        )}
    
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Controller control={control} name={"transactionDate"} render={({field}) => (
                                <DatePicker value={field.value} ref={field.ref} onChange={(d) => field.onChange(d)} placeholder="Data transakcji" />
                            )} />
                        </div>
    
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Label>Sprzedawca</Label>
                                    {vendorFromAi && <AiSuggestionMarker/>}
                                </div>
                                {canUseAiSuggestions && (
                                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs"
                                            disabled={aiSuggestionMutation.isPending}
                                            onClick={() => aiSuggestionMutation.mutate()}>
                                        {aiSuggestionMutation.isPending
                                            ? <Loader2 className="h-3 w-3 animate-spin"/>
                                            : <Sparkles className="h-3 w-3"/>}
                                        Zasugeruj
                                    </Button>
                                )}
                            </div>
                            <Controller
                                control={control}
                                name="vendor"
                                render={({field}) => (
                                    <Autocomplete fetchSuggestions={async input => {
                                                      const suggestions = await vendorsClient.autocompleteVendors(input);
                                                      lastVendorSuggestions.current = suggestions;
                                                      return suggestions.map(s => ({ id: s.vendorId, name: s.vendorName }));
                                                  }}
                                                  value={field.value.name} clearQueryAfterSelection={false}
                                                  onChange={value => {
                                                      if (!value) {
                                                          field.onChange({id: undefined, name: ""})
                                                          return
                                                      }
                                                      field.onChange({...value})

                                                      if (value?.id) {
                                                          const suggestion = lastVendorSuggestions.current.find(s => s.vendorId === value.id)
                                                          if (suggestion?.defaultSubcategoryId) {
                                                              setValue("subcategoryId", suggestion.defaultSubcategoryId, {
                                                                  shouldValidate: true,
                                                                  shouldDirty: true
                                                              })
                                                              const isIncomeCategory = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === suggestion.defaultSubcategoryId))?.isIncome;
                                                              if (isIncomeCategory !== undefined) {
                                                                  setValue("isExpense", !isIncomeCategory, {
                                                                      shouldValidate: true,
                                                                      shouldDirty: true
                                                                  })
                                                              }
                                                          }
                                                      }
                                                  }} allowCustomValues={true}/>
                                )}
                            />
                            {errors.vendor?.name &&
                                <span className="text-red-500 text-xs">{errors.vendor.name.message}</span>}
                        </div>
    
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label>Kategoria</Label>
                                {subcategoryFromAi && <AiSuggestionMarker/>}
                            </div>
                            <Controller
                                control={control}
                                name="subcategoryId"
                                render={({field}) => (
                                    <Select onValueChange={(val) => {
                                        const parsedSubcategoryId = Number(val);
                                        field.onChange(parsedSubcategoryId);
                                        if (parsedSubcategoryId) {
                                            const isIncomeCategory = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === parsedSubcategoryId))?.isIncome;
                                            if (isIncomeCategory !== undefined) {
                                                setValue("isExpense", !isIncomeCategory, {
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                })
                                            }
                                        }
                                    }} value={(field.value > 0) ? field.value.toString() : ""}>
                                        <SelectTrigger className="w-full overflow-hidden">
                                            <SelectValue placeholder="Wybierz kategorię" className={"truncate"}>
                                                {(() => {
                                                    if (!field.value) return "Kategoria";
                                                    const selectedCat = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === field.value));
                                                    return selectedCat
                                                        ? `${selectedCat.name} / ${selectedCat.subcategories.find(s => s.id === field.value)!.name}`
                                                        : "Kategoria";
                                                })()}
                                            </SelectValue>
                                        </SelectTrigger>
                                        
                                        <SelectContent>
                                            {categoriesQuery.data && visibleCategories(categoriesQuery.data, field.value, transactionDateValue || new Date()).map(category => (
                                                <SelectGroup key={category.id}>
                                                    <SelectLabel>{category.name}</SelectLabel>
                                                    {category.subcategories.map(subcategory => (
                                                        <SelectItem key={subcategory.id}
                                                                    value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.subcategoryId &&
                                <span className="text-red-500 text-xs">{errors.subcategoryId.message}</span>}
                        </div>
    
                        <div className="grid gap-2">
                            <Label>Kwota</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <Controller
                                        control={control}
                                        name="isExpense"
                                        render={({field}) => (<InputGroupButton
                                                onClick={() => setDirection(!field.value)}
                                                tabIndex={-1}
                                            >
                                                {field.value ? <Minus className={"text-expense"} /> : <Plus className={"text-income"} />}
                                            </InputGroupButton>
                                        )}
                                    />
                                    
                                </InputGroupAddon>
                                <InputGroupInput placeholder="0.00" type="number" step="0.01" {...register("amount")} onKeyDown={e => {
                                    if (e.key === "-" || e.key === "+") {
                                        e.preventDefault();
                                        setDirection(e.key === "-")
                                    }
                                }}  />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>zł</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                        </div>
    
                        <div className="grid gap-2">
                            <Label>Opis</Label>
                            <div className="flex gap-2">
                                <Textarea className="grow-2" {...register("description")} />
                                <ParsedDescription control={control as unknown as Control<WithDescription>}
                                                   onResultClick={calculatedAmount =>
                                                       setValue("amount", calculatedAmount, {
                                                           shouldValidate: true,
                                                           shouldDirty: true
                                                       })}/>
                            </div>
                            {errors.description &&
                                <span className="text-red-500 text-xs">{errors.description.message}</span>}
                        </div>
    
                        <div className="grid gap-2">
                            <Label>Tagi</Label>
    
                            <Controller
                                control={control}
                                name="tags"
                                render={({field}) => (
                                    <TagsInput
                                        options={tagsQuery.data || []}
                                        value={field.value}
                                        onChange={(val) => {
                                            field.onChange(val)
                                        }}/>
                                )}
                            />
                        </div>

                    </div>
                    <DialogFooter className={"mt-4"}>
                        <Button type="submit" disabled={mutation.isPending || isLoadingTransaction}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}