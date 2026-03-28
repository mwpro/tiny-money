import {useQuery} from "@tanstack/react-query"
import {Link, useParams} from "react-router-dom"
import {format, parseISO} from "date-fns"
import {pl} from "date-fns/locale/pl"
import {ChevronLeftIcon, PencilIcon} from "lucide-react"
import {useState} from "react"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {prepareTitleText} from "@/lib/utils.ts"
import {PlanProgressBar} from "@/features/plans/PlanProgressBar.tsx"
import {PlanEditorDialog} from "@/features/plans/PlanEditorDialog.tsx"
import {PlanDeleteDialog} from "@/features/plans/PlanDeleteDialog.tsx"
import {PlanTagLinesTable} from "@/features/plans/PlanTagLinesTable.tsx"
import {Curr} from "@/components/Curr.tsx"
import {Button} from "@/components/ui/button"

function formatDate(dateStr: string) {
    return format(parseISO(dateStr), "d MMMM yyyy", {locale: pl})
}

export function PlanDetailPage() {
    const {planId} = useParams<{ planId: string }>()
    const id = Number(planId)
    const {plansClient} = useApiClient()
    const [editOpen, setEditOpen] = useState(false)

    const planQuery = useQuery({
        queryKey: ['plans', id],
        queryFn: () => plansClient.getPlan(id),
        enabled: !isNaN(id)
    })

    const plan = planQuery.data
    const totalBudget = plan?.tagLines.reduce((s, l) => s + l.amount, 0) ?? 0
    const totalSpent = plan?.tagLines.reduce((s, l) => s + l.spent, 0) ?? 0

    return (
        <div className="max-w-7xl mx-auto">
            {plan && <title>{prepareTitleText(plan.title)}</title>}

            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
                    <Link to="/plans"><ChevronLeftIcon className="size-4 mr-1"/>Plany</Link>
                </Button>

                {planQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
                {planQuery.isError && <div className="p-10 text-destructive">{planQuery.error?.message ?? 'Błąd ładowania danych'}</div>}

                {plan && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold font-serif">{plan.title}</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {formatDate(plan.dateFrom)}
                                    {plan.dateTo ? ` – ${formatDate(plan.dateTo)}` : " – bezterminowy"}
                                </p>
                                {plan.description && (
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{plan.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditOpen(true)}
                                >
                                    <PencilIcon className="size-3.5 mr-1"/>
                                    Edytuj
                                </Button>
                                <PlanDeleteDialog planId={plan.id} planTitle={plan.title}/>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Łącznie</span>
                                <span>
                                    <Curr input={totalSpent}/>{" "}
                                    <span className="text-muted-foreground">z</span>{" "}
                                    <Curr input={totalBudget}/>
                                </span>
                            </div>
                            <PlanProgressBar spent={totalSpent} budget={totalBudget}/>
                        </div>
                    </>
                )}
            </div>

            {plan && (
                <>
                    <PlanTagLinesTable plan={plan}/>
                    <PlanEditorDialog
                        planToEdit={editOpen ? plan : undefined}
                        onClose={() => setEditOpen(false)}
                        trigger={<span/>}
                    />
                </>
            )}
        </div>
    )
}
