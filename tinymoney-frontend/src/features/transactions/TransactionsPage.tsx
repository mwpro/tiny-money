import { useQuery } from "@tanstack/react-query" // <--- Import hooka
import {getTransactions, getVendors, getTags, getCategories} from "@/lib/api"      // <--- Import naszej funkcji
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Badge} from "@/components/ui/badge.tsx";
import {useAuth0} from "@auth0/auth0-react";
import {AddTransactionDialog} from "@/features/transactions/transactions-editor/AddTransactionDialog.tsx";

export function TransactionsPage() {
    const auth = useAuth0();

    // To jest serce React Query:
    // queryKey: unikalna nazwa danych w cache (jak klucz w Redis)
    // queryFn: funkcja, która fizycznie pobiera dane
    const transactionsQuery = useQuery({
        queryKey: ['transactions'],
        queryFn: () => getTransactions(auth),
    })

    // 2. Pobieranie Słowników (z długim staleTime - np. 5 minut)
    // Słowniki nie zmieniają się tak często jak transakcje, więc nie chcemy ich ciągle odświeżać.
    const dictionariesConfig = { staleTime: 1000 * 60 * 5 }

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

    // Obsługa stanów ładowania i błędów - super prosta!
    if (transactionsQuery.isLoading || vendorsQuery.isLoading || categoriesQuery.isLoading || tagsQuery.isLoading) {
        return <div className="p-10">Ładowanie danych...</div>
    }
    if (transactionsQuery.isError || vendorsQuery.isError || categoriesQuery.isError || tagsQuery.isError) {
        console.log(transactionsQuery.error)
        return <div className="p-10 text-red-500">Błąd ładowania danych</div>
    }

    const getVendorName = (id: number) => {
        return vendorsQuery.data?.find(v => v.id === id)?.name || "-"
    }

    const getSubcategoryName = (id: number) => {
        return categoriesQuery.data?.get(id) || "-"
    }

    const getTagNames = (ids: number[]) => {
        if (!ids || ids.length === 0) return [];
        return ids.map(id => tagsQuery.data?.find(t => t.id === id)).filter(Boolean).map(x => x!);
    }

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Moje Finanse</h1>
                <AddTransactionDialog />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Opis</TableHead>
                            <TableHead>Sprzedawca</TableHead>
                            <TableHead>Kategoria</TableHead>
                            <TableHead>Tagi</TableHead>
                            <TableHead className="text-right">Kwota</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsQuery.data?.map((t) => (
                            <TableRow key={t.id}>
                                {/* Data */}
                                <TableCell className="w-[120px]">
                                    {new Date(t.transactionDate).toLocaleDateString('pl-PL')}
                                </TableCell>

                                {/* Opis */}
                                <TableCell className="font-medium">{t.description}</TableCell>

                                {/* Sprzedawca (Lookup) */}
                                <TableCell>{getVendorName(t.vendorId)}</TableCell>

                                {/* Kategoria (Lookup) */}
                                <TableCell>{getSubcategoryName(t.subcategoryId)}</TableCell>

                                {/* Tagi (Pętla po IDkach) */}
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {getTagNames(t.tagIds).map((tag) => (
                                            <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>

                                {/* Kwota (Kolor zależny od isExpense) */}
                                <TableCell className={`text-right font-mono ${t.isExpense ? "text-red-600" : "text-green-600"}`}>
                                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(t.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}