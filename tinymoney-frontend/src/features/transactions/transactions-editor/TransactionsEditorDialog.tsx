import {useEffect, useState} from "react"
import {type Control, Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {z} from "zod"
import {
    addTransaction,
    editTransaction,
    getCategories,
    getTags,
    getVendors,
    type NewTransaction,
    type Transaction
} from "@/lib/api"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import {TagsInput} from "@/components/TagsInput.tsx";
import Autocomplete from "@/components/Autocomplete.tsx";
import {transactionSchema} from "@/features/transactions/transactions-editor/TransactionSchema.ts";
import {format} from "date-fns";
import {Textarea} from "@/components/ui/textarea.tsx";
import {
    ParsedDescription,
    type WithDescription
} from "@/features/transactions/transactions-editor/ParsedDescription.tsx";

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionEditorDialogProps {
    transactionToEdit?: Transaction
}

export function TransactionsEditorDialog({transactionToEdit}: TransactionEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const auth = useAuth0();

    useEffect(() => {
        setIsOpen(!!transactionToEdit);
    }, [transactionToEdit]);
    
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

    const {register, control, handleSubmit, setValue, formState: {errors, defaultValues}, getValues, reset} = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: transactionToEdit?.amount || 0,
            description: "",
            isExpense: true,
            transactionDate: format(new Date(), "yyyy-MM-dd"),
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
            setValue("transactionDate", format(transactionToEdit.transactionDate, "yyyy-MM-dd"));
            setValue("subcategoryId", transactionToEdit.subcategoryId);
            const selectedVendor = vendorsQuery.data?.find(v => v.id === transactionToEdit.vendorId)
            if (selectedVendor) {
                setValue("vendor", selectedVendor);
            }
            const selectedTags = tagsQuery.data?.filter(t => transactionToEdit.tagIds.includes(t.id));
            if (selectedTags) {
                setValue("tags", selectedTags);
            }
        } else {
            reset()
        }
    }, [transactionToEdit]);

    const mutation = useMutation({
        mutationFn: (newTransaction: NewTransaction) => transactionToEdit
            ? editTransaction(transactionToEdit.id, newTransaction, auth)
            : addTransaction(newTransaction, auth),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            queryClient.invalidateQueries({queryKey: ['vendors']})
            queryClient.invalidateQueries({queryKey: ['categories']})
            queryClient.invalidateQueries({queryKey: ['tags']})
            if (transactionToEdit) {
                reset();
                setIsOpen(false);
            } else {
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

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label>Data</Label>
                        <Input type="date" {...register("transactionDate")} />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Sprzedawca</Label>
                        <Controller
                            control={control}
                            name="vendor"
                            render={({field}) => (
                                <Autocomplete fetchSuggestions={async input => (vendorsQuery.data || []).filter(o =>
                                    o.name.toLowerCase().includes(input.toLowerCase()))}
                                              value={field.value.name} clearQueryAfterSelection={false}
                                              onChange={value => {
                                                  if (!value) {
                                                      field.onChange({id: undefined, name: ""})
                                                      return
                                                  }
                                                  field.onChange({...value})

                                                  if (value?.id) {
                                                      const selectedVendor = vendorsQuery.data?.find(v => v.id === value.id)
                                                      if (selectedVendor?.defaultSubcategoryId) {
                                                          setValue("subcategoryId", selectedVendor.defaultSubcategoryId, {
                                                              shouldValidate: true,
                                                              shouldDirty: true
                                                          })
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
                                <Select onValueChange={(val) => field.onChange(Number(val))}
                                        value={(field.value > 0) ? field.value.toString() : ""}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Wybierz kategorię"/></SelectTrigger>
                                    <SelectContent>
                                        {categoriesQuery.data && categoriesQuery.data.map(category => (
                                            <SelectGroup key={category.id}>
                                                <SelectLabel>{category.name}</SelectLabel>
                                                {category.subcategories.map(subcategory => (<SelectItem key={subcategory.id} value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
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
                        <Input type="number" step="0.01" {...register("amount")} />
                        {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Controller
                            control={control}
                            name="isExpense"
                            render={({field}) => (
                                <Checkbox
                                    id="isExpense"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="isExpense">To jest wydatek</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label>Opis</Label>
                        <div className="flex gap-2">
                            <Textarea className="grow-2" {...register("description")} />
                            <ParsedDescription control={control as unknown as Control<WithDescription>} onResultClick={calculatedAmount =>
                                setValue("amount", calculatedAmount, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                })} />
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

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}