import {useEffect, useRef} from "react"
import {Controller, useFieldArray, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import type {Transaction} from "@/api/ApiTypes.ts"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {TagsInput} from "@/components/TagsInput.tsx"
import Autocomplete from "@/components/Autocomplete.tsx"
import {format} from "date-fns"
import {dateFormat} from "@/lib/utils.ts"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {toast} from "sonner"
import {Plus, Trash2} from "lucide-react"
import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group.tsx"
import type {VendorSuggestion} from "@/api/ApiTypes.ts"

const splitPartSchema = z.object({
    amount: z.coerce.number<number>().gt(0, "Kwota musi być większa od 0"),
    isExpense: z.boolean(),
    subcategoryId: z.coerce.number<number>().min(1, "Kategoria jest wymagana"),
    vendor: z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Sprzedawca jest wymagany")
    }),
    tags: z.array(z.object({
        id: z.number().optional(),
        name: z.string()
    }))
})

const splitFormSchema = z.object({
    splits: z.array(splitPartSchema).min(2)
})

type SplitFormValues = z.infer<typeof splitFormSchema>

interface SplitTransactionDialogProps {
    transaction: Transaction | undefined
    onClose: () => void
}

export function SplitTransactionDialog({transaction, onClose}: SplitTransactionDialogProps) {
    const {transactionsClient, vendorsClient, categoriesClient, tagsClient} = useApiClient()
    const queryClient = useQueryClient()
    const lastVendorSuggestions = useRef<VendorSuggestion[]>([])

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

    const {control, handleSubmit, setValue, watch, reset, register, formState: {errors}} = useForm<SplitFormValues>({
        resolver: zodResolver(splitFormSchema),
        defaultValues: {splits: []}
    })

    useEffect(() => {
        if (transaction) {
            const defaultSplit = {
                isExpense: transaction.isExpense,
                subcategoryId: transaction.subcategoryId ?? 0,
                vendor: {id: transaction.vendorId ?? undefined, name: transaction.vendorName ?? ""},
                tags: transaction.tags.map(t => ({id: t.id, name: t.name}))
            }
            reset({
                splits: [
                    {...defaultSplit, amount: transaction.amount},
                    {...defaultSplit, amount: 0}
                ]
            })
        }
    }, [transaction])

    const {fields, append, remove} = useFieldArray({control, name: "splits"})

    const splits = watch("splits")
    const totalAssigned = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    const remaining = (transaction?.amount ?? 0) - totalAssigned
    const isBalanced = Math.abs(remaining) < 0.001

    const mutation = useMutation({
        mutationFn: (data: SplitFormValues) =>
            transactionsClient.splitTransaction(transaction!.id, {
                splits: data.splits.map(s => ({
                    amount: s.amount,
                    isExpense: s.isExpense,
                    subcategoryId: s.subcategoryId,
                    vendor: s.vendor,
                    tags: s.tags
                }))
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            reset()
            onClose()
        },
        onError: (error: Error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset()
            onClose()
        }
    }

    const onSubmit = (data: SplitFormValues) => mutation.mutate(data)

    return (
        <Dialog open={!!transaction} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Podziel transakcję</DialogTitle>
                    <DialogDescription asChild>
                        <div>
                            <div>{transaction && format(new Date(transaction.transactionDate), dateFormat)} · {transaction?.amount?.toFixed(2)} zł</div>
                            {transaction?.description && <div>{transaction.description}</div>}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 max-h-[50vh] overflow-y-auto no-scrollbar -mx-4 px-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="border rounded-md p-3 grid gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Część {index + 1}</span>
                                    {fields.length > 2 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Kwota</Label>
                                    <InputGroup>
                                        <InputGroupInput
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...register(`splits.${index}.amount`)}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>zł</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    {errors.splits?.[index]?.amount && (
                                        <span className="text-red-500 text-xs">{errors.splits[index].amount?.message}</span>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Sprzedawca</Label>
                                    <Controller
                                        control={control}
                                        name={`splits.${index}.vendor`}
                                        render={({field: f}) => (
                                            <Autocomplete
                                                fetchSuggestions={async input => {
                                                    const suggestions = await vendorsClient.autocompleteVendors(input)
                                                    lastVendorSuggestions.current = suggestions
                                                    return suggestions.map(s => ({id: s.vendorId, name: s.vendorName}))
                                                }}
                                                value={f.value.name}
                                                clearQueryAfterSelection={false}
                                                onChange={value => {
                                                    if (!value) {
                                                        f.onChange({id: undefined, name: ""})
                                                        return
                                                    }
                                                    f.onChange({...value})
                                                    if (value?.id) {
                                                        const suggestion = lastVendorSuggestions.current.find(s => s.vendorId === value.id)
                                                        const currentSubcategoryId = splits[index]?.subcategoryId
                                                        if (suggestion?.defaultSubcategoryId && !currentSubcategoryId) {
                                                            setValue(`splits.${index}.subcategoryId`, suggestion.defaultSubcategoryId)
                                                            const isIncomeCategory = categoriesQuery.data?.find(c =>
                                                                c.subcategories.some(s => s.id === suggestion.defaultSubcategoryId))?.isIncome
                                                            if (isIncomeCategory !== undefined) {
                                                                setValue(`splits.${index}.isExpense`, !isIncomeCategory)
                                                            }
                                                        }
                                                    }
                                                }}
                                                allowCustomValues={true}
                                            />
                                        )}
                                    />
                                    {errors.splits?.[index]?.vendor?.name && (
                                        <span className="text-red-500 text-xs">{errors.splits[index].vendor?.name?.message}</span>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Kategoria</Label>
                                    <Controller
                                        control={control}
                                        name={`splits.${index}.subcategoryId`}
                                        render={({field: f}) => (
                                            <Select
                                                onValueChange={(val) => {
                                                    const parsed = Number(val)
                                                    f.onChange(parsed || undefined)
                                                    if (parsed) {
                                                        const isIncomeCategory = categoriesQuery.data?.find(c =>
                                                            c.subcategories.some(s => s.id === parsed))?.isIncome
                                                        if (isIncomeCategory !== undefined) {
                                                            setValue(`splits.${index}.isExpense`, !isIncomeCategory)
                                                        }
                                                    }
                                                }}
                                                value={f.value ? f.value.toString() : ""}
                                            >
                                                <SelectTrigger className="w-full overflow-hidden">
                                                    <SelectValue placeholder="Wybierz kategorię">
                                                        {(() => {
                                                            if (!f.value) return "Kategoria"
                                                            const selectedCat = categoriesQuery.data?.find(c =>
                                                                c.subcategories.some(s => s.id === f.value))
                                                            return selectedCat
                                                                ? `${selectedCat.name} / ${selectedCat.subcategories.find(s => s.id === f.value)!.name}`
                                                                : "Kategoria"
                                                        })()}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categoriesQuery.data?.map(category => (
                                                        <SelectGroup key={category.id}>
                                                            <SelectLabel>{category.name}</SelectLabel>
                                                            {category.subcategories.map(subcategory => (
                                                                <SelectItem key={subcategory.id}
                                                                            value={subcategory.id.toString()}>
                                                                    {subcategory.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.splits?.[index]?.subcategoryId && (
                                        <span className="text-red-500 text-xs">{errors.splits[index].subcategoryId?.message}</span>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Tagi</Label>
                                    <Controller
                                        control={control}
                                        name={`splits.${index}.tags`}
                                        render={({field: f}) => (
                                            <TagsInput
                                                options={tagsQuery.data || []}
                                                value={f.value}
                                                onChange={f.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({
                                amount: 0,
                                isExpense: transaction?.isExpense ?? true,
                                subcategoryId: transaction?.subcategoryId ?? 0,
                                vendor: {id: transaction?.vendorId ?? undefined, name: transaction?.vendorName ?? ""},
                                tags: transaction?.tags.map(t => ({id: t.id, name: t.name})) ?? []
                            })}
                        >
                            <Plus className="mr-2 h-4 w-4"/> Dodaj część
                        </Button>
                    </div>

                    <div className="flex justify-between items-center mt-4 py-2 border-t text-sm">
                        <span>Przypisano: <strong>{totalAssigned.toFixed(2)} zł</strong></span>
                        <span className={!isBalanced ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                            Pozostało: {remaining.toFixed(2)} zł
                        </span>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={!isBalanced || mutation.isPending}>
                            {mutation.isPending ? "Dzielenie..." : "Podziel"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
