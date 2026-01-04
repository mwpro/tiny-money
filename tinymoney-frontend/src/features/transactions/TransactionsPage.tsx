import {useQuery} from "@tanstack/react-query"
import {
    getTransactions,
    getVendors,
    getTags,
    getCategories,
    type Transaction
} from "@/lib/api"
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
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {DropdownMenuTrigger} from "@/components/ui/dropdown-menu.tsx";
import {useState} from "react";
import {TransactionRemovalDialog} from "@/features/transactions/TransactionRemovalDialog.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";

export function TransactionsPage() {
    const auth = useAuth0();
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | undefined>(undefined)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined)

    const transactionsQuery = useQuery({
        queryKey: ['transactions'],
        queryFn: () => getTransactions(auth),
    })
    
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
        <div className="p-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Moje Finanse</h1>
                <TransactionsEditorDialog transactionToEdit={transactionToEdit} onClose={() => setTransactionToEdit(undefined)} />
                <TransactionRemovalDialog transactionToRemove={transactionToRemove} onClose={() => setTransactionToRemove(undefined)} />
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
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsQuery.data?.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="w-[120px]">
                                    {new Date(t.transactionDate).toLocaleDateString('pl-PL')}
                                </TableCell>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell>{getVendorName(t.vendorId)}</TableCell>
                                <TableCell>{getSubcategoryName(t.subcategoryId)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {getTagNames(t.tagIds).map((tag) => (
                                            <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className={`text-right font-mono ${t.isExpense ? "text-red-600" : "text-green-600"}`}>
                                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(t.amount)}
                                </TableCell>
                                <TableCell>
                                    <ButtonGroup>
                                        <Button variant="outline" onClick={() => setTransactionToEdit(t)}>Edytuj</Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" aria-label="More Options">
                                                    ...
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuItem variant="destructive" onClick={() => setTransactionToRemove(t)}>
                                                        Usuń
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </ButtonGroup>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}