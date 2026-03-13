import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {NotebookTextIcon} from "lucide-react";
import type {CategoryBudgetSummary} from "@/api/ApiTypes.ts";

type Props = { topOverspent: CategoryBudgetSummary[] };

export function BudgetOverspentWidget({topOverspent}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>Budżet - Największe przekroczenie</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {topOverspent.length === 0
                    ? <p className="text-sm text-muted-foreground">Brak przekroczeń</p>
                    : topOverspent.map(c => (
                        <div key={c.subcategoryName} className="flex justify-between items-center text-sm py-0.5">
                            <span className="flex items-center gap-1">
                                {c.categoryName} / {c.subcategoryName}
                                {c.notes && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <NotebookTextIcon className="h-3.5 w-3.5 text-muted-foreground cursor-default"/>
                                        </TooltipTrigger>
                                        <TooltipContent>{c.notes}</TooltipContent>
                                    </Tooltip>
                                )}
                            </span>
                            
                            <Tooltip>
                                <TooltipTrigger>
                                    <Curr input={c.amountLeft} colored isPositive={false}/>
                                </TooltipTrigger>
                                <TooltipContent>budżet: <Curr input={c.amount} /></TooltipContent>
                            </Tooltip>
                        </div>
                    ))
                }
            </CardContent>
        </Card>
    );
}
