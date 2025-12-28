import {useState} from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {z} from "zod" // Nasz walidator
import {addTransaction} from "@/lib/api"

// Komponenty UI
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"

// 1. Schemat walidacji (odpowiednik FluentValidation)
const transactionSchema = z.object({
    amount: z.coerce.number(),//.coerce.number().refine((val) => val !== 0, "Kwota nie może być zerem"), // coerce zamienia string z inputa na number
    isExpense: z.boolean(),
    transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data"),
    description: z.string().min(3, "Opis musi mieć min. 3 znaki"),
    subcategoryId: z.coerce.number().min(1, "Kategoria jest wymagana"),
})

// Typ wywnioskowany ze schematu (automatyczny TypeScript!)
type TransactionFormValues = z.infer<typeof transactionSchema>

export function AddTransactionDialog() {
    const [open, setOpen] = useState(false) // Czy okno jest otwarte?
    const queryClient = useQueryClient() // Dostęp do cache'a

    // 2. Konfiguracja formularza
    const {register, handleSubmit, formState: {errors}, reset} = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            description: "",
            isExpense: true,
            transactionDate: new Date().toISOString().split('T')[0], // Dzisiejsza data YYYY-MM-DD
            subcategoryId: 0,
        }
    })

    // 3. Mutacja (wysłanie do API)
    const mutation = useMutation({
        mutationFn: addTransaction,
        onSuccess: () => {
            // Sukces!
            queryClient.invalidateQueries({queryKey: ['transactions']}) // Odśwież tabelę w tle
            setOpen(false) // Zamknij okno
            reset() // Wyczyść formularz
        },
        onError: (error) => {
            alert("Błąd: " + error.message)
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

                {/* Formularz */}
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">

                    {/* Pole: Opis */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Opis</Label>
                        <Input id="description" {...register("description")} />
                        {errors.description &&
                            <span className="text-red-500 text-xs">{errors.description.message}</span>}
                    </div>

                    {/* Pole: Kwota */}
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Kwota (PLN)</Label>
                        <Input id="amount" type="number" step="0.01" {...register("amount")} />
                        {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                    </div>

                    {/* Pole: Kategoria */}
                    <div className="grid gap-2">
                        <Label htmlFor="category">Kategoria</Label>
                        <Input id="category" {...register("subcategoryId")} placeholder="np. Jedzenie"/>
                        {errors.subcategoryId && <span className="text-red-500 text-xs">{errors.subcategoryId.message}</span>}
                    </div>

                    {/* Pole: Data */}
                    <div className="grid gap-2">
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" type="date" {...register("transactionDate")} />
                        {errors.transactionDate && <span className="text-red-500 text-xs">{errors.transactionDate.message}</span>}
                    </div>

                    <DialogFooter>
                        {/* Przycisk jest disabled jak trwa wysyłanie */}
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}