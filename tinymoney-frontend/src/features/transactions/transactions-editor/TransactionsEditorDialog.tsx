import {useEffect, useRef, useState} from "react"
import {type Control, Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {z} from "zod"
import {
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
import {AlertTriangle, Minus, Plus} from "lucide-react";
import {DatePicker} from "@/components/DatePicker.tsx";
import {dateFormat} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {Alert, AlertDescription} from "@/components/ui/alert.tsx";
import {AliasProposalDialog} from "@/features/transactions/transactions-editor/AliasProposalDialog.tsx";

export type TransactionFormValues = z.infer<typeof transactionSchema>

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
    const queryClient = useQueryClient()
    const { transactionsClient, vendorsClient, categoriesClient, tagsClient } = useApiClient();
    
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

    useEffect(() => {
        setIsOpen(!!transactionToEdit);
        if (transactionToEdit) {
            setValue("amount", transactionToEdit.amount)
            setValue("description", transactionToEdit.description ?? "")
            setValue("isExpense", transactionToEdit.isExpense);
            setValue("transactionDate", format(transactionToEdit.transactionDate, dateFormat));
            if (transactionToEdit.subcategoryId !== null) {
                setValue("subcategoryId", transactionToEdit.subcategoryId);
            }
            if (transactionToEdit.vendorId !== null && transactionToEdit.vendorName !== null) {
                setValue("vendor", { id: transactionToEdit.vendorId, name: transactionToEdit.vendorName });
            }
            const selectedTags = tagsQuery.data?.filter(t => transactionToEdit.tags.some(tt => tt.id === t.id));
            if (selectedTags) {
                setValue("tags", selectedTags);
            }
        } else {
            reset()
        }
    }, [transactionToEdit]);

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
                    setPendingDescription(transactionToEdit.description)
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 -mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
                            
                        {transactionToEdit && (!transactionToEdit.isVerified || transactionToEdit.isPossibleDuplicate) && (
                            <Alert variant="default" className="border-amber-400">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <AlertDescription className="text-amber-700">
                                    {!transactionToEdit.isVerified && transactionToEdit.isPossibleDuplicate
                                        ? "Ta transakcja nie została jeszcze zweryfikowana i może być duplikatem istniejącej transakcji."
                                        : !transactionToEdit.isVerified
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
                            <Label>Sprzedawca</Label>
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
                            <Label>Kategoria</Label>
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
                                            {categoriesQuery.data && categoriesQuery.data.map(category => (
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
                                                onClick={() => field.onChange(!field.value)}
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
                                        setValue("isExpense", (e.key === "-"), {
                                            shouldValidate: true,
                                            shouldDirty: true
                                        })
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
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}