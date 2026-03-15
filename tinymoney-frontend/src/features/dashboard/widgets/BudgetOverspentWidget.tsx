import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {NotebookTextIcon} from "lucide-react";
import {Link} from "react-router-dom";
import {getTransactionsUrl} from "@/lib/utils.ts";
import type {CategoryBudgetSummary} from "@/api/ApiTypes.ts";

type Props = { topOverspent: CategoryBudgetSummary[]; monthStart: Date; monthEnd: Date };

export function BudgetOverspentWidget({topOverspent, monthStart, monthEnd}: Props) {
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
                                <Link
                                    to={getTransactionsUrl({subcategoryId: c.subcategoryId, dateFrom: monthStart, dateTo: monthEnd})}
                                    className="hover:underline"
                                >
                                    {c.categoryName} / {c.subcategoryName}
                                </Link>
                                {c.notes && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button type="button" className="cursor-default">
                                                <NotebookTextIcon className="h-3.5 w-3.5 text-muted-foreground"/>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="text-xs w-fit max-w-64 px-3 py-1.5">{c.notes}</PopoverContent>
                                    </Popover>
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
