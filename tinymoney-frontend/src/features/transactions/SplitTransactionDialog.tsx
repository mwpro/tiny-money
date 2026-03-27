import {useEffect} from "react"
import {useFieldArray, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import type {Transaction} from "@/api/ApiTypes.ts"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {format} from "date-fns"
import {dateFormat} from "@/lib/utils.ts"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {toast} from "sonner"
import {Plus} from "lucide-react"
import {SplitPartEditor} from "@/features/transactions/SplitPartEditor.tsx"
import {Curr} from "@/components/Curr.tsx"

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

export type SplitFormValues = z.infer<typeof splitFormSchema>

interface SplitTransactionDialogProps {
    transaction: Transaction | undefined
    onClose: () => void
}

export function SplitTransactionDialog({transaction, onClose}: SplitTransactionDialogProps) {
    const {transactionsClient} = useApiClient()
    const queryClient = useQueryClient()

    const {control, handleSubmit, setValue, watch, reset, register, formState: {errors}} = useForm<SplitFormValues>({
        resolver: zodResolver(splitFormSchema),
        defaultValues: {splits: []}
    })

    useEffect(() => {
        if (transaction) {
            const defaults = {
                isExpense: transaction.isExpense,
                subcategoryId: transaction.subcategoryId ?? 0,
                vendor: {id: transaction.vendorId ?? undefined, name: transaction.vendorName ?? ""},
                tags: transaction.tags.map(t => ({id: t.id, name: t.name}))
            }
            reset({
                splits: [
                    {...defaults, amount: transaction.amount},
                    {...defaults, amount: null as unknown as number}
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
        onError: (error: Error) => toast.error("Błąd: " + error.message)
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) { reset(); onClose() }
    }

    const defaultForNewPart = () => ({
        amount: null as unknown as number,
        isExpense: transaction?.isExpense ?? true,
        subcategoryId: transaction?.subcategoryId ?? 0,
        vendor: {id: transaction?.vendorId ?? undefined, name: transaction?.vendorName ?? ""},
        tags: transaction?.tags.map(t => ({id: t.id, name: t.name})) ?? []
    })

    return (
        <Dialog open={!!transaction} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Podziel transakcję</DialogTitle>
                    <DialogDescription asChild>
                        <div>
                            <div>{transaction && format(new Date(transaction.transactionDate), dateFormat)}</div>
                            {transaction?.description && <div>{transaction.description}</div>}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(data => mutation.mutate(data))}>
                    <div className="grid gap-4 max-h-[50vh] overflow-y-auto no-scrollbar -mx-4 px-4">
                        {fields.map((field, index) => (
                            <SplitPartEditor
                                key={field.id}
                                index={index}
                                control={control}
                                register={register}
                                setValue={setValue}
                                currentSubcategoryId={splits[index]?.subcategoryId}
                                errors={errors}
                                canRemove={fields.length > 2}
                                onRemove={() => remove(index)}
                            />
                        ))}

                        <Button type="button" variant="outline" onClick={() => append(defaultForNewPart())}>
                            <Plus className="mr-2 h-4 w-4"/> Dodaj część
                        </Button>
                    </div>

                    <div className="flex justify-between items-center mt-4 py-2 border-t text-sm">
                        <span>Przypisano <br/><Curr input={totalAssigned}/> z <Curr input={transaction?.amount ?? 0}/></span>
                        <span className={!isBalanced ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                            Pozostało: <br/><Curr input={remaining}/>
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
