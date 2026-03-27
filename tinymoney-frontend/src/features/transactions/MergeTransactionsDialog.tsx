import {useEffect, useRef} from "react"
import {Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import type {Transaction, VendorSuggestion} from "@/api/ApiTypes.ts"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea.tsx"
import {TagsInput} from "@/components/TagsInput.tsx"
import Autocomplete from "@/components/Autocomplete.tsx"
import {DatePicker} from "@/components/DatePicker.tsx"
import {Curr, formatCurrencyAsString} from "@/components/Curr.tsx"
import {format} from "date-fns"
import {dateFormat} from "@/lib/utils.ts"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {toast} from "sonner"

const mergeFormSchema = z.object({
    transactionDate: z.string().min(1, "Data jest wymagana"),
    description: z.string(),
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

type MergeFormValues = z.infer<typeof mergeFormSchema>

interface MergeTransactionsDialogProps {
    open: boolean
    selectedIds: Set<number>
    transactions: Transaction[]
    onClose: () => void
    onSuccess: () => void
}

function buildDefaultDescription(sources: Transaction[], net: number): string {
    const lines = sources.map(t => {
        const dateStr = format(new Date(t.transactionDate), dateFormat)
        const label = t.description ?? t.vendorName ?? ""
        const signedAmount = t.isExpense ? -t.amount : t.amount
        return `${dateStr} ${label} (${formatCurrencyAsString(signedAmount)})`
    })
    const netStr = `= ${formatCurrencyAsString(net)}`
    return [...lines, netStr].join("\n")
}

export function MergeTransactionsDialog({open, selectedIds, transactions, onClose, onSuccess}: MergeTransactionsDialogProps) {
    const {transactionsClient, vendorsClient, categoriesClient, tagsClient} = useApiClient()
    const queryClient = useQueryClient()
    const lastVendorSuggestions = useRef<VendorSuggestion[]>([])

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const categoriesQuery = useQuery({queryKey: ['categories'], queryFn: () => categoriesClient.getCategories(), ...dictionariesConfig})
    const tagsQuery = useQuery({queryKey: ['tags'], queryFn: () => tagsClient.getTags(), ...dictionariesConfig})

    const {control, handleSubmit, reset, setValue, formState: {errors}} = useForm<MergeFormValues>({
        resolver: zodResolver(mergeFormSchema),
        defaultValues: {
            transactionDate: format(new Date(), dateFormat),
            description: "",
            subcategoryId: 0,
            vendor: {id: undefined, name: ""},
            tags: []
        }
    })

    const sources = transactions.filter(t => selectedIds.has(t.id))
    const net = sources.reduce((sum, t) => sum + (t.isExpense ? -t.amount : t.amount), 0)
    const isExpenseResult = net < 0

    useEffect(() => {
        if (!open || sources.length < 2) return

        const earliestDate = sources.reduce((min, t) =>
            new Date(t.transactionDate) < new Date(min.transactionDate) ? t : min
        ).transactionDate

        const matchingSource = sources.find(t =>
            t.isExpense === isExpenseResult && t.vendorId !== null && t.subcategoryId !== null
        )

        reset({
            transactionDate: format(new Date(earliestDate), dateFormat),
            description: buildDefaultDescription(sources, net),
            subcategoryId: matchingSource?.subcategoryId ?? 0,
            vendor: matchingSource
                ? {id: matchingSource.vendorId!, name: matchingSource.vendorName!}
                : {id: undefined, name: ""},
            tags: Array.from(
                new Map(sources.flatMap(t => t.tags).map(tag => [tag.id, tag])).values()
            )
        })
    }, [open])

    const mutation = useMutation({
        mutationFn: (data: MergeFormValues) => transactionsClient.mergeTransactions({
            transactionIds: Array.from(selectedIds),
            transactionDate: data.transactionDate,
            description: data.description || undefined,
            subcategoryId: data.subcategoryId,
            vendor: data.vendor,
            tags: data.tags
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            onSuccess()
        },
        onError: (error: Error) => toast.error("Błąd: " + error.message)
    })

    const filteredCategories = categoriesQuery.data?.filter(c =>
        isExpenseResult ? !c.isIncome : c.isIncome
    ) ?? []

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Połącz transakcje</DialogTitle>
                    <DialogDescription>
                        Łączenie {selectedIds.size} transakcji w jedną
                    </DialogDescription>
                </DialogHeader>

                <div className="border rounded-md divide-y text-sm max-h-48 overflow-y-auto">
                    {sources.map(t => (
                        <div key={t.id} className="px-3 py-1.5 flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex gap-2 items-baseline">
                                    <span className="text-muted-foreground shrink-0">{format(new Date(t.transactionDate), dateFormat)}</span>
                                    <span className="truncate">{t.description ?? "—"}</span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                    {t.vendorName ?? "—"}
                                    {t.categoryName && t.subcategoryName && (
                                        <span> · {t.categoryName} / {t.subcategoryName}</span>
                                    )}
                                </div>
                            </div>
                            <Curr input={t.amount} colored isPositive={!t.isExpense} />
                        </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-1.5 font-medium">
                        <span>Wynik</span>
                        <Curr input={Math.abs(net)} colored isPositive={!isExpenseResult} />
                    </div>
                </div>

                <form onSubmit={handleSubmit((data: MergeFormValues) => mutation.mutate(data))}>
                    <div className="grid gap-4 -mx-4 no-scrollbar max-h-[40vh] overflow-y-auto px-4">

                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Controller control={control} name="transactionDate" render={({field}) => (
                                <DatePicker value={field.value} ref={field.ref} onChange={d => field.onChange(d)} placeholder="Data transakcji" />
                            )} />
                            {errors.transactionDate && <span className="text-red-500 text-xs">{errors.transactionDate.message}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Sprzedawca</Label>
                            <Controller
                                control={control}
                                name="vendor"
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
                                            f.onChange(value ? {...value} : {id: undefined, name: ""})
                                            if (value?.id) {
                                                const suggestion = lastVendorSuggestions.current.find(s => s.vendorId === value.id)
                                                if (suggestion?.defaultSubcategoryId) {
                                                    const category = categoriesQuery.data?.find(c =>
                                                        c.subcategories.some(s => s.id === suggestion.defaultSubcategoryId))
                                                    const matchesType = category && (isExpenseResult ? !category.isIncome : category.isIncome)
                                                    if (matchesType) {
                                                        setValue("subcategoryId", suggestion.defaultSubcategoryId)
                                                    }
                                                }
                                            }
                                        }}
                                        allowCustomValues={true}
                                    />
                                )}
                            />
                            {errors.vendor?.name && <span className="text-red-500 text-xs">{errors.vendor.name.message}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Kategoria ({isExpenseResult ? "wydatki" : "przychody"})</Label>
                            <Controller
                                control={control}
                                name="subcategoryId"
                                render={({field: f}) => (
                                    <Select
                                        onValueChange={val => f.onChange(Number(val) || 0)}
                                        value={f.value > 0 ? f.value.toString() : ""}
                                    >
                                        <SelectTrigger className="w-full overflow-hidden">
                                            <SelectValue placeholder="Wybierz kategorię">
                                                {(() => {
                                                    if (!f.value) return "Kategoria"
                                                    const selectedCat = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === f.value))
                                                    return selectedCat
                                                        ? `${selectedCat.name} / ${selectedCat.subcategories.find(s => s.id === f.value)!.name}`
                                                        : "Kategoria"
                                                })()}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.map(category => (
                                                <SelectGroup key={category.id}>
                                                    <SelectLabel>{category.name}</SelectLabel>
                                                    {category.subcategories.map(sub => (
                                                        <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.subcategoryId && <span className="text-red-500 text-xs">{errors.subcategoryId.message}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Opis</Label>
                            <Controller control={control} name="description" render={({field}) => (
                                <Textarea {...field} rows={Math.min(sources.length + 2, 8)} className="font-mono text-xs" />
                            )} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tagi</Label>
                            <Controller
                                control={control}
                                name="tags"
                                render={({field: f}) => (
                                    <TagsInput options={tagsQuery.data ?? []} value={f.value} onChange={f.onChange} />
                                )}
                            />
                        </div>

                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Łączenie..." : "Połącz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
