import {useQuery} from "@tanstack/react-query"
import {type SavingsAccount, type SavingsCategory} from "@/api/ApiTypes.ts"
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {prepareTitleText} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {SavingsCategoryEditorDialog} from "@/features/savings/SavingsCategoryEditorDialog.tsx";
import {SavingsCategoryRemovalDialog} from "@/features/savings/SavingsCategoryRemovalDialog.tsx";
import {SavingsAccountEditorDialog} from "@/features/savings/SavingsAccountEditorDialog.tsx";

export function SavingsAccountsPage() {
    const {savingsClient} = useApiClient();
    const [categoryToEdit, setCategoryToEdit] = useState<SavingsCategory | undefined>(undefined)
    const [categoryToRemove, setCategoryToRemove] = useState<SavingsCategory | undefined>(undefined)
    const [accountToEdit, setAccountToEdit] = useState<SavingsAccount | undefined>(undefined)
    const [showArchived, setShowArchived] = useState(false)

    const categoriesQuery = useQuery({
        queryKey: ['savings-categories'],
        queryFn: () => savingsClient.getCategories()
    })

    const accountsQuery = useQuery({
        queryKey: ['savings-accounts', showArchived],
        queryFn: () => savingsClient.getAccounts(showArchived)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Oszczędności")}</title>
            <h1 className="text-2xl font-bold font-serif mb-8">Oszczędności</h1>

            {/* Accounts section */}
            <section className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Konta</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch id="showArchived" size="sm" checked={showArchived} onCheckedChange={setShowArchived} />
                            <Label htmlFor="showArchived">Pokaż zarchiwizowane</Label>
                        </div>
                        <SavingsAccountEditorDialog
                            accountToEdit={accountToEdit}
                            onClose={() => setAccountToEdit(undefined)}
                        />
                    </div>
                </div>

                {accountsQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
                {accountsQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}
                {accountsQuery.data && (
                    <div className="border rounded-md">
                        <Table className="table-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa</TableHead>
                                    <TableHead>Kategoria</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accountsQuery.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            <Alert variant="default">
                                                <AlertTitle>Brak kont. Dodaj pierwsze konto.</AlertTitle>
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {accountsQuery.data.map(account => (
                                    <TableRow key={account.id}>
                                        <TableCell>{account.name}</TableCell>
                                        <TableCell>{account.categoryName}</TableCell>
                                        <TableCell>
                                            <Badge variant={account.isActive ? "default" : "secondary"}>
                                                {account.isActive ? "Aktywne" : "Zarchiwizowane"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setAccountToEdit(account)}>Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </section>

            {/* Categories section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Kategorie kont</h2>
                    <SavingsCategoryEditorDialog
                        categoryToEdit={categoryToEdit}
                        onClose={() => setCategoryToEdit(undefined)}
                    />
                </div>
                <SavingsCategoryRemovalDialog
                    categoryToRemove={categoryToRemove}
                    onClose={() => setCategoryToRemove(undefined)}
                />

                {categoriesQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
                {categoriesQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}
                {categoriesQuery.data && (
                    <div className="border rounded-md">
                        <Table className="table-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoriesQuery.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center">
                                            <Alert variant="default">
                                                <AlertTitle>Brak kategorii. Dodaj pierwszą kategorię.</AlertTitle>
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {categoriesQuery.data.map(category => (
                                    <TableRow key={category.id}>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell className="flex justify-end">
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setCategoryToEdit(category)}>Edytuj</Button>
                                                <Button variant="outline" className="hover:bg-destructive hover:text-white" size="sm" onClick={() => setCategoryToRemove(category)}>Usuń</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </section>
        </div>
    )
}
