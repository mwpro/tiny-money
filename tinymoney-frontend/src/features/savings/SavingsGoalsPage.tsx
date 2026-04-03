import {useQuery} from "@tanstack/react-query"
import {useState} from "react"
import {Link} from "react-router-dom"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {prepareTitleText} from "@/lib/utils.ts"
import {Button} from "@/components/ui/button.tsx"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx"
import {Alert, AlertTitle} from "@/components/ui/alert.tsx"
import {Badge} from "@/components/ui/badge.tsx"
import {Curr} from "@/components/Curr.tsx"
import type {SavingsGoal} from "@/api/ApiTypes.ts"
import {SavingsGoalEditorDialog} from "@/features/savings/SavingsGoalEditorDialog.tsx"
import {SavingsGoalRemovalDialog} from "@/features/savings/SavingsGoalRemovalDialog.tsx"

export function SavingsGoalsPage() {
    const {savingsClient} = useApiClient()
    const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | undefined>(undefined)
    const [goalToRemove, setGoalToRemove] = useState<SavingsGoal | undefined>(undefined)

    const goalsQuery = useQuery({
        queryKey: ['savings-goals'],
        queryFn: () => savingsClient.getGoals()
    })

    const categoriesQuery = useQuery({
        queryKey: ['savings-categories'],
        queryFn: () => savingsClient.getCategories(),
        staleTime: 1000 * 60 * 5
    })

    const categoryName = (id: number) =>
        categoriesQuery.data?.find(c => c.id === id)?.name ?? String(id)

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Cele oszczędnościowe")}</title>
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" asChild className="px-0">
                    <Link to="/savings">← Oszczędności</Link>
                </Button>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-serif">Cele oszczędnościowe</h1>
                <SavingsGoalEditorDialog
                    goalToEdit={goalToEdit}
                    onClose={() => setGoalToEdit(undefined)}
                />
            </div>

            <SavingsGoalRemovalDialog
                goalToRemove={goalToRemove}
                onClose={() => setGoalToRemove(undefined)}
            />

            {goalsQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
            {goalsQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}

            {goalsQuery.data && (
                <div className="border rounded-md">
                    <Table className="table-auto">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Kwota docelowa</TableHead>
                                <TableHead>Data docelowa</TableHead>
                                <TableHead>Kategorie</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goalsQuery.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        <Alert variant="default">
                                            <AlertTitle>Brak celów. Dodaj pierwszy cel.</AlertTitle>
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            )}
                            {goalsQuery.data.map(goal => (
                                <TableRow key={goal.id}>
                                    <TableCell className="font-medium">{goal.name}</TableCell>
                                    <TableCell><Curr input={goal.targetAmount} /></TableCell>
                                    <TableCell>{goal.targetDate ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {goal.categoryIds.length === 0
                                                ? <span className="text-muted-foreground text-sm">Brak</span>
                                                : goal.categoryIds.map(id => (
                                                    <Badge key={id} variant="secondary">{categoryName(id)}</Badge>
                                                ))
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setGoalToEdit(goal)}>Edytuj</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hover:bg-destructive hover:text-white"
                                            onClick={() => setGoalToRemove(goal)}
                                        >
                                            Usuń
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
