import {Link} from "react-router-dom"
import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card"
import {Curr} from "@/components/Curr.tsx"
import {PlanProgressBar} from "@/features/plans/PlanProgressBar.tsx"
import type {ActivePlanSummary} from "@/api/ApiTypes.ts"

type Props = { activePlans: ActivePlanSummary[] };

export function ActivePlansWidget({activePlans}: Props) {
    return (
        <Card className="sm:col-span-2">
            <CardHeader>
                <CardDescription>Plany</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {activePlans.length === 0
                    ? <p className="text-sm text-muted-foreground">Brak aktywnych planów</p>
                    : activePlans.map(p => (
                        <div key={p.id} className="py-1.5">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <Link to={`/plans/${p.id}`} className="hover:underline font-medium truncate mr-2">
                                    {p.title}
                                </Link>
                                <span className="text-muted-foreground shrink-0 text-xs">
                                    <Curr input={p.totalSpent}/> z <Curr input={p.totalBudget}/>
                                </span>
                            </div>
                            <PlanProgressBar percent={p.spentPercent}/>
                        </div>
                    ))
                }
            </CardContent>
        </Card>
    )
}
