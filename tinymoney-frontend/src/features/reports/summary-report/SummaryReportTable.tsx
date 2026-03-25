import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Curr} from "@/components/Curr.tsx";
import type {SummaryReport} from "@/api/ApiTypes.ts";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {ComparisonTooltip} from "@/features/reports/summary-report/ComparisonTooltip.tsx";

interface BudgetTableProps {
    reportData: SummaryReport,
    splitByMonth?: boolean
}

export function SummaryReportTable({reportData, splitByMonth}: BudgetTableProps) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        {reportData.periods.map(period => (
                            <TableHead key={period.periodLabel} className="text-right">{period.periodLabel}</TableHead>))}
                        <TableHead>Suma</TableHead>
                        <TableHead>Średnia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Przychody</TableCell>
                        {reportData.periods.map(period => (
                            <TableCell key={period.periodLabel} className="text-right">
                                <ComparisonTooltip
                                    current={period.incomesSum}
                                    yoySum={period.yoyIncomesSum}
                                    periodLabel={period.periodLabel}
                                    splitByMonth={splitByMonth ?? false}>
                                    <Curr input={period.incomesSum}/>
                                </ComparisonTooltip>
                            </TableCell>))}
                        <TableCell><Curr input={reportData.incomesSum}/></TableCell>
                        <TableCell><Curr input={reportData.incomesAvg}/></TableCell>
                    </TableRow>
                    {splitByMonth && <TableRow>
                        <TableCell>Budżet</TableCell>
                        {reportData.periods.map(period => (
                            <TableCell key={period.periodLabel} className="text-right">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Curr input={period.budget} colored isPositive={period.budgetDifference >= 0}/>
                                    </TooltipTrigger>
                                    <TooltipContent side={"bottom"} className={"font-mono"}>
                                        <p>Różnica: <Curr input={period.budgetDifference} colored/></p>
                                    </TooltipContent>
                                </Tooltip></TableCell>))}
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                    </TableRow>}
                    <TableRow>
                        <TableCell>Wydatki</TableCell>
                        {reportData.periods.map(period => (
                            <TableCell key={period.periodLabel} className="text-right">
                                <ComparisonTooltip
                                    current={period.expensesSum}
                                    yoySum={period.yoyExpensesSum}
                                    periodLabel={period.periodLabel}
                                    splitByMonth={splitByMonth ?? false}
                                    lowerIsBetter>
                                    <Curr input={period.expensesSum}/>
                                </ComparisonTooltip>
                            </TableCell>))}
                        <TableCell><Curr input={reportData.expensesSum}/></TableCell>
                        <TableCell><Curr input={reportData.expensesAvg}/></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Blians</TableCell>
                        {reportData.periods.map(period => (
                            <TableCell key={period.periodLabel} className="text-right">
                                <ComparisonTooltip
                                    current={period.balance}
                                    yoySum={period.yoyBalance}
                                    periodLabel={period.periodLabel}
                                    splitByMonth={splitByMonth ?? false}>
                                    <Curr input={period.balance} colored/>
                                </ComparisonTooltip>
                            </TableCell>))}
                        <TableCell><Curr input={reportData.balanceSum} colored/></TableCell>
                        <TableCell><Curr input={reportData.balanceAvg} colored/></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
