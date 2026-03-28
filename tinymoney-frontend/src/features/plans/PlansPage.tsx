import {useQuery} from "@tanstack/react-query"
import {Link} from "react-router-dom"
import {format, parseISO} from "date-fns"
import {pl} from "date-fns/locale/pl"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {prepareTitleText} from "@/lib/utils.ts"
import {PlanProgressBar} from "@/features/plans/PlanProgressBar.tsx"
import {PlanEditorDialog} from "@/features/plans/PlanEditorDialog.tsx"
import {Curr} from "@/components/Curr.tsx"
import type {PlanSummary} from "@/api/ApiTypes.ts"

function formatPlanDate(dateStr: string) {
    return format(parseISO(dateStr), "d MMM yyyy", {locale: pl})
}

function PlanDateRange({plan}: { plan: PlanSummary }) {
    if (!plan.dateTo) return <span>{formatPlanDate(plan.dateFrom)} – bezterminowy</span>
    return <span>{formatPlanDate(plan.dateFrom)} – {formatPlanDate(plan.dateTo)}</span>
}

function PlanRow({plan}: { plan: PlanSummary }) {
    return (
        <Link
            to={`/plans/${plan.id}`}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 border rounded-md hover:bg-muted/50 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{plan.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                    <PlanDateRange plan={plan}/>
                </div>
            </div>
            <div className="flex flex-col gap-1 sm:w-48">
                <PlanProgressBar spent={plan.totalSpent} budget={plan.totalBudget}/>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <Curr input={plan.totalSpent}/>
                    <span className="text-muted-foreground/60">z</span>
                    <Curr input={plan.totalBudget}/>
                </div>
            </div>
        </Link>
    )
}

export function PlansPage() {
    const {plansClient} = useApiClient()
    const plansQuery = useQuery({
        queryKey: ['plans'],
        queryFn: () => plansClient.getPlans()
    })

    const activePlans = plansQuery.data?.filter(p => p.isActive) ?? []
    const archivedPlans = plansQuery.data?.filter(p => !p.isActive) ?? []

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Plany")}</title>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold font-serif">Plany</h1>
                <PlanEditorDialog/>
            </div>

            {plansQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
            {plansQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}

            {plansQuery.data && (
                <div className="flex flex-col gap-8">
                    <section>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aktywne</h2>
                        {activePlans.length === 0
                            ? <p className="text-sm text-muted-foreground">Brak aktywnych planów.</p>
                            : <div className="flex flex-col gap-2">
                                {activePlans.map(p => <PlanRow key={p.id} plan={p}/>)}
                            </div>
                        }
                    </section>

                    {archivedPlans.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Archiwum</h2>
                            <div className="flex flex-col gap-2">
                                {archivedPlans.map(p => <PlanRow key={p.id} plan={p}/>)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
