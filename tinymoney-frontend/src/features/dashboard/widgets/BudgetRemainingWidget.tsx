import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {NotebookTextIcon} from "lucide-react";
import type {CategoryBudgetSummary} from "@/api/ApiTypes.ts";

type Props = { topRemaining: CategoryBudgetSummary[] };

export function BudgetRemainingWidget({topRemaining}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>Budżet - Największa nadwyżka</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {topRemaining.length === 0
                    ? <p className="text-sm text-muted-foreground">Brak nadwyżek</p>
                    : topRemaining.map(c => (
                        <div key={c.subcategoryName} className="flex justify-between items-center text-sm py-0.5">
                            <span className="flex items-center gap-1">
                                {c.subcategoryName}
                                {c.notes && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <NotebookTextIcon className="h-3.5 w-3.5 text-muted-foreground cursor-default"/>
                                        </TooltipTrigger>
                                        <TooltipContent>{c.notes}</TooltipContent>
                                    </Tooltip>
                                )}
                            </span>
                            <Curr input={c.amountLeft} colored isPositive={true}/>
                        </div>
                    ))
                }
            </CardContent>
        </Card>
    );
}
