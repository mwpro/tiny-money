import {useState} from "react"
import {Link} from "react-router-dom"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {PencilIcon, Trash2Icon} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx"
import {Curr} from "@/components/Curr.tsx"
import {PlanProgressBar} from "@/features/plans/PlanProgressBar.tsx"
import {PlanTagEditorDialog} from "@/features/plans/PlanTagEditorDialog.tsx"
import {getTransactionsUrl} from "@/lib/utils.ts"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {PlanDetail, PlanTagLine} from "@/api/ApiTypes.ts"
import {parseISO} from "date-fns"

interface PlanTagLinesTableProps {
    plan: PlanDetail;
}

export function PlanTagLinesTable({plan}: PlanTagLinesTableProps) {
    const {plansClient} = useApiClient()
    const queryClient = useQueryClient()
    const [tagToEdit, setTagToEdit] = useState<PlanTagLine | undefined>(undefined)
    const [tagToDelete, setTagToDelete] = useState<PlanTagLine | undefined>(undefined)

    const deleteMutation = useMutation({
        mutationFn: (tagId: number) => plansClient.deletePlanTag(plan.id, tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['plans', plan.id]})
            setTagToDelete(undefined)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
            setTagToDelete(undefined)
        }
    })

    const transactionsUrl = (tagId: number) => getTransactionsUrl({
        tagId,
        dateFrom: parseISO(plan.dateFrom),
        dateTo: plan.dateTo ? parseISO(plan.dateTo) : undefined,
        isExpense: true
    })

    const existingTagIds = plan.tagLines.map(t => t.tagId)

    return (
        <div className="flex flex-col gap-4">
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tag</TableHead>
                            <TableHead className="text-right">Budżet</TableHead>
                            <TableHead className="text-right">Wydano</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Pozostało</TableHead>
                            <TableHead className="w-px"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plan.tagLines.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                                    Brak pozycji. Dodaj pierwszą pozycję poniżej.
                                </TableCell>
                            </TableRow>
                        )}
                        {plan.tagLines.map(line => {
                            const remaining = line.amount - line.spent
                            return (
                                <TableRow key={line.tagId}>
                                    <TableCell>
                                        <div>
                                            <Link
                                                to={transactionsUrl(line.tagId)}
                                                className="hover:underline font-medium"
                                            >
                                                {line.tagName}
                                            </Link>
                                            <PlanProgressBar percent={line.spentPercent} className="mt-1"/>
                                            {line.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{line.description}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right"><Curr input={line.amount}/></TableCell>
                                    <TableCell className="text-right"><Curr input={line.spent}/></TableCell>
                                    <TableCell className="text-right hidden sm:table-cell">
                                        <Curr input={remaining} colored isPositive={remaining >= 0}/>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setTagToEdit(line)}
                                            >
                                                <PencilIcon className="size-3.5"/>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:text-destructive"
                                                onClick={() => setTagToDelete(line)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2Icon className="size-3.5"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <PlanTagEditorDialog
                planId={plan.id}
                existingTagIds={existingTagIds}
                tagLine={tagToEdit}
                onEditClose={() => setTagToEdit(undefined)}
            />

            <AlertDialog open={!!tagToDelete} onOpenChange={(v) => { if (!v) setTagToDelete(undefined) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń pozycję</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz usunąć pozycję <strong>{tagToDelete?.tagName}</strong> z planu?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tagToDelete && deleteMutation.mutate(tagToDelete.tagId)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
