import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, Category, SubcategoryBudgetSuggestions} from "@/lib/api.ts";
import {Fragment} from "react";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {Link} from "react-router-dom";
import {endOfMonth, format, startOfMonth} from "date-fns";
import {ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";

interface BudgetTableProps {
    budgetPeriod: MonthSelection,
    reportPeriods: string[]
}

export function SummaryReportTable({budgetPeriod, reportPeriods}: BudgetTableProps) {
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    const transactionsListPath = `/transactions?dateFrom=${format(startOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}`
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        {reportPeriods.map(month => (<TableHead className="text-right">{month}</TableHead>))}
                        <TableHead>Suma</TableHead>
                        <TableHead>Średnia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className={`${!100 ? "text-gray-400" : ""}`}>
                        <TableCell>Przychody</TableCell>
                        {reportPeriods.map(() => (
                            <TableCell className="text-right"><Curr input={500} colored={false}/></TableCell>))}
                        <TableCell><Curr input={500} colored={false}/></TableCell>
                        <TableCell><Curr input={500} colored={false}/></TableCell>
                    </TableRow>
                    <TableRow className={`${!100 ? "text-gray-400" : ""}`}>
                        <TableCell>Budżet</TableCell>
                        {reportPeriods.map(() => (
                            <TableCell className="text-right"><Curr input={500}/></TableCell>))}
                        <TableCell><Curr input={500}/></TableCell>
                        <TableCell><Curr input={500}/></TableCell>
                    </TableRow>
                    <TableRow className={`${!100 ? "text-gray-400" : ""}`}>
                        <TableCell>Wydatki</TableCell>
                        {reportPeriods.map(() => (
                            <TableCell className="text-right"><Curr input={500} colored={false}/></TableCell>))}
                        <TableCell><Curr input={500} colored={false}/></TableCell>
                        <TableCell><Curr input={500} colored={false}/></TableCell>
                    </TableRow>
                    <TableRow className={`${!100 ? "text-gray-400" : ""}`}>
                        <TableCell>Blians</TableCell>
                        {reportPeriods.map(() => (
                            <TableCell className="text-right"><Curr input={500}/></TableCell>))}
                        <TableCell><Curr input={500}/></TableCell>
                        <TableCell><Curr input={500}/></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}