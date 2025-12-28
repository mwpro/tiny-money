import { useQuery } from "@tanstack/react-query" // <--- Import hooka
import { getTransactions } from "@/lib/api"      // <--- Import naszej funkcji
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

function App() {
    // To jest serce React Query:
    // queryKey: unikalna nazwa danych w cache (jak klucz w Redis)
    // queryFn: funkcja, która fizycznie pobiera dane
    const { data: transactions, isLoading, isError, error } = useQuery({
        queryKey: ['transactions'],
        queryFn: getTransactions,
    })

    // Obsługa stanów ładowania i błędów - super prosta!
    if (isLoading) return <div className="p-10">Ładowanie transakcji...</div>
    if (isError) return <div className="p-10 text-red-500">Błąd: {error.message}</div>

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Moje Finanse</h1>
                <Button>Dodaj Transakcję</Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Opis</TableHead>
                            <TableHead>Kategoria</TableHead>
                            <TableHead className="text-right">Kwota</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Zauważ pytajnik przy transactions?.map - zabezpieczenie, gdyby data było null */}
                        {transactions?.map((t) => (
                            <TableRow key={t.id}>
                                {/* Formatowanie daty - JS ma do tego wbudowane Intl */}
                                <TableCell>{new Date(t.transactionDate).toLocaleDateString('pl-PL')}</TableCell>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell>
                   <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                    {t.subcategoryId}
                  </span>
                                </TableCell>
                                <TableCell className={`text-right ${(t.isExpense ? "text-red-600" : "text-green-600")}`}>
                                    {/* Formatowanie waluty */}
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

export default App