import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Curr} from "@/components/Curr.tsx";
import type {CategoriesReport} from "@/lib/api.ts";

interface BudgetTableProps {
    reportData: CategoriesReport
}

export function SummaryReportTable({reportData}: BudgetTableProps) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        {reportData.periods.map(period => (<TableHead className="text-right">{period.periodLabel}</TableHead>))}
                        <TableHead>Suma</TableHead>
                        <TableHead>Średnia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Przychody</TableCell>
                        {reportData.periods.map(period => (<TableCell className="text-right"><Curr input={period.incomesSum}/></TableCell>))}
                        <TableCell><Curr input={reportData.incomesSum}/></TableCell>
                        <TableCell><Curr input={reportData.incomesAvg}/></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Budżet</TableCell>
                        {/*todo nie pokazywać per rok*/}
                        {reportData.periods.map(period => (<TableCell className="text-right"><Curr input={period.budget} colored/></TableCell>))}
                        <TableCell><Curr input={reportData.budgetSum}/></TableCell>
                        <TableCell><Curr input={reportData.budgetAvg}/></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Wydatki</TableCell>
                        {reportData.periods.map(period => (<TableCell className="text-right"><Curr input={period.expensesSum}/></TableCell>))}
                        <TableCell><Curr input={reportData.expensesSum}/></TableCell>
                        <TableCell><Curr input={reportData.expensesAvg}/></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Blians</TableCell>
                        {reportData.periods.map(period => (<TableCell className="text-right"><Curr input={period.balance} colored/></TableCell>))}
                        <TableCell><Curr input={reportData.balanceSum} colored/></TableCell>
                        <TableCell><Curr input={reportData.balanceAvg} colored/></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}