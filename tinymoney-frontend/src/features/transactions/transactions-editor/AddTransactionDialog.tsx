import {useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {z} from "zod"
import {addTransaction, getCategories, getTags, getVendors, type NewTransaction} from "@/lib/api"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import {TagsInput} from "@/components/TagsInput.tsx";
import Autocomplete from "@/components/Autocomplete.tsx";
import {transactionSchema} from "@/features/transactions/transactions-editor/TransactionSchema.ts";

type TransactionFormValues = z.infer<typeof transactionSchema>

export function AddTransactionDialog() {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()
    const auth = useAuth0();
    
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

    const {register, control, handleSubmit, setValue, formState: {errors}, reset} = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            description: "",
            isExpense: true,
            transactionDate: "2025-12-13",// new Date().toISOString().split('T')[0], // Dzisiejsza data YYYY-MM-DD
            subcategoryId: 0,
            vendor: {id: undefined, name: ""},
            tags: []
        }
    })

    const mutation = useMutation({
        mutationFn: (newTransaction: NewTransaction) => addTransaction(newTransaction, auth),
        onSuccess: () => {
            // Sukces!
            queryClient.invalidateQueries({queryKey: ['transactions']}) // Odśwież tabelę w tle
            queryClient.invalidateQueries({queryKey: ['vendors']})
            queryClient.invalidateQueries({queryKey: ['categories']})
            queryClient.invalidateQueries({queryKey: ['tags']})
            setOpen(false)
            reset()
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: TransactionFormValues) => {
        mutation.mutate(data)
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Dodaj Transakcję</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nowa transakcja</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">

                    {/* Wiersz 1: Opis i Data */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Opis</Label>
                            <Input {...register("description")} />
                            {errors.description &&
                                <span className="text-red-500 text-xs">{errors.description.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input type="date" {...register("transactionDate")} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Sprzedawca (Wybierz lub wpisz nowy)</Label>
                        <Controller
                            control={control}
                            name="vendor"
                            render={({field}) => (
                                <Autocomplete fetchSuggestions={async input => (vendorsQuery.data || []).filter(o =>
                                    o.name.toLowerCase().includes(input.toLowerCase()))}
                                onChange={value => {
                                            field.onChange({...value, defaultSubcategoryId: 0}) // todo is this default needed?
                                    
                                            if (value.id) {
                                                const selectedVendor = vendorsQuery.data?.find(v => v.id === value.id)
                                                if (selectedVendor?.defaultSubcategoryId) {
                                                    setValue("subcategoryId", selectedVendor.defaultSubcategoryId, {
                                                        shouldValidate: true, 
                                                        shouldDirty: true
                                                    })
                                                }
                                            }
                                }}/>
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
                                        value={field.value.toString()}>
                                    <SelectTrigger><SelectValue placeholder="Kategoria"/></SelectTrigger>
                                    <SelectContent>
                                        {categoriesQuery.data && Array.from(categoriesQuery.data, ([id, name]) => ({
                                            id,
                                            name
                                        })).map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}
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