import {useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {z} from "zod" // Nasz walidator
import {addTransaction, getCategories, getTags, getVendors} from "@/lib/api"
import { SmartCombobox} from "@/components/SmartCombobox.tsx";

// Komponenty UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // npx shadcn@latest add checkbox
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select" // npx shadcn@latest add select

// 1. Schemat walidacji (odpowiednik FluentValidation)
const transactionSchema = z.object({
    amount: z.coerce.number(),//.coerce.number().refine((val) => val !== 0, "Kwota nie może być zerem"), // coerce zamienia string z inputa na number
    isExpense: z.boolean(),
    transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data"),
    description: z.string().min(3, "Opis musi mieć min. 3 znaki"),
    subcategoryId: z.coerce.number().min(1, "Kategoria jest wymagana"),
    // Obiekt VendorUpsert
    vendor: z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Sprzedawca wymagany")
    }),
    // Tagi - tablica obiektów TagUpsert
    // Dla uproszczenia w UI wybierzemy jeden tag i zapakujemy go w tablicę
    tags: z.array(z.object({
        id: z.number().optional(),
        name: z.string()
    }))
})

// Typ wywnioskowany ze schematu (automatyczny TypeScript!)
type TransactionFormValues = z.infer<typeof transactionSchema>

export function AddTransactionDialog() {
    const [open, setOpen] = useState(false) // Czy okno jest otwarte?
    const queryClient = useQueryClient() // Dostęp do cache'a

    // 2. Pobieranie Słowników (z długim staleTime - np. 5 minut)
    // Słowniki nie zmieniają się tak często jak transakcje, więc nie chcemy ich ciągle odświeżać.
    const dictionariesConfig = { staleTime: 1000 * 60 * 5 }

    const vendorsQuery = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
        ...dictionariesConfig
    })

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        ...dictionariesConfig
    })

    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: getTags,
        ...dictionariesConfig
    })
    
    // 2. Konfiguracja formularza
    const {register, control, handleSubmit, formState: {errors}, reset} = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            description: "",
            isExpense: true,
            transactionDate: new Date().toISOString().split('T')[0], // Dzisiejsza data YYYY-MM-DD
            subcategoryId: 0,
            vendor: { id: undefined, name: "" },
            tags: []
        }
    })

    // 3. Mutacja (wysłanie do API)
    const mutation = useMutation({
        mutationFn: addTransaction,
        onSuccess: () => {
            // Sukces!
            queryClient.invalidateQueries({queryKey: ['transactions']}) // Odśwież tabelę w tle
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
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

                    {/* Wiersz 1: Opis i Data */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Opis</Label>
                            <Input {...register("description")} />
                            {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input type="date" {...register("transactionDate")} />
                        </div>
                    </div>

                    {/* Wiersz 2: Vendor (Smart Combobox) */}
                    <div className="grid gap-2">
                        <Label>Sprzedawca (Wybierz lub wpisz nowy)</Label>
                        {/* Używamy Controller, bo Combobox nie jest natywnym inputem HTML */}
                        <Controller
                            control={control}
                            name="vendor"
                            render={({ field }) => (
                                <SmartCombobox
                                    options={vendorsQuery.data || []}
                                    value={field.value}
                                    onChange={(val) => {
                                        // Przy zmianie vendora, aktualizujemy pole
                                        // Ustawiamy defaultSubcategoryId na 0 (nadpiszemy w onSubmit jeśli nowy)
                                        field.onChange({ ...val, defaultSubcategoryId: 0 })
                                    }}
                                    placeholder="Wybierz sklep..."
                                />
                            )}
                        />
                        {errors.vendor?.name && <span className="text-red-500 text-xs">{errors.vendor.name.message}</span>}
                    </div>

                    {/* Wiersz 3: Kategoria i Kwota */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Kategoria</Label>
                            {/* Prosty Select dla kategorii (bo zazwyczaj wybieramy z listy) */}
                            <Controller
                                control={control}
                                name="subcategoryId"
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value.toString()}>
                                        <SelectTrigger><SelectValue placeholder="Kategoria" /></SelectTrigger>
                                        <SelectContent>
                                            {/*return categoriesQuery.data?.flatMap(c => c.subcategories.map(s => ({ id: s.id, name: `${c.name} / ${s.name}` })))*/}
                                            {categoriesQuery.data?.flatMap(c => c.subcategories.map(s => (<SelectItem key={s.id} value={s.id.toString()}>{c.name} / {s.name}</SelectItem>)))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.subcategoryId && <span className="text-red-500 text-xs">{errors.subcategoryId.message}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Kwota</Label>
                            <Input type="number" step="0.01" {...register("amount")} />
                            {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                        </div>
                    </div>

                    {/* Checkbox: Wydatek vs Przychód */}
                    <div className="flex items-center space-x-2">
                        <Controller
                            control={control}
                            name="isExpense"
                            render={({ field }) => (
                                <Checkbox
                                    id="isExpense"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="isExpense">To jest wydatek</Label>
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