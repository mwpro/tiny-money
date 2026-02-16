import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {ReportCategory} from "@/lib/api.ts";
import {Fragment, useState} from "react";
import {Link} from "react-router-dom";
import {endOfMonth, endOfYear, format, parse} from "date-fns";
import {ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";
import type {ReportSettings} from "@/features/reports/summary-report/SummaryReportPage.tsx";

interface BudgetTableProps {
    categories: ReportCategory[],
    reportSettings: ReportSettings
}

export function CategoriesTable({categories, reportSettings}: BudgetTableProps) {
    const [expandedCategory, setExpandedCategory] = useState<number | undefined>(undefined);
    
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        {categories[0].periods.map(period => (
                            <TableHead key={period.periodLabel} className="text-right">{period.periodLabel}</TableHead>))}
                        <TableHead>Suma</TableHead>
                        <TableHead>Średnia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <Fragment key={category.categoryId}>
                            {categories.length > 1 && <TableRow key={category.categoryId} className="bg-gray-100">
                                <TableCell onClick={() => setExpandedCategory(prev => prev !== category.categoryId ? category.categoryId : undefined)}
                                           className={`font-bold`}>{category.categoryName}</TableCell>
                                {category.periods.map(period => (<TableCell key={period.periodLabel} className="text-right">
                                    <Curr input={period.transactionsSum}/>
                                </TableCell>))}
                                <TableCell><Curr input={category.transactionsSum}/></TableCell>
                                <TableCell><Curr input={category.transactionsAvg}/></TableCell>
                            </TableRow>}
                            {(categories.length == 1 || expandedCategory == category.categoryId) && category.subcategories.map(subcategory => {
                                const transactionsListPath = `/transactions?subcategoryId=${subcategory.subcategoryId}`
                                return (
                                    <TableRow key={`${category.categoryId}-${subcategory.subcategoryId}`}>
                                        <TableCell>
                                            <Link
                                                to={`${transactionsListPath}&dateFrom=${format(reportSettings.dateFrom!, "yyyy-MM-dd")}&dateTo=${format(reportSettings.dateTo!, "yyyy-MM-dd")}`}
                                                target={"_blank"}>
                                                <ListIcon className="inline pr-1" size={19}/>
                                            </Link>
                                            {subcategory.subcategoryName}
                                        </TableCell>
                                        {subcategory.periods.map(period => (
                                            <TableCell key={period.periodLabel} className="text-right">
                                                <Link
                                                    to={`${transactionsListPath}&dateFrom=${format(parse(period.periodLabel, reportSettings.splitByMonth ? "yyyy-MM" : "yyyy", new Date()), "yyyy-MM-dd")}&dateTo=${format(reportSettings.splitByMonth ? endOfMonth(parse(period.periodLabel, "yyyy-MM", new Date())) : endOfYear(parse(period.periodLabel, "yyyy", new Date())), "yyyy-MM-dd")}`}
                                                    target={"_blank"}>
                                                    <Curr input={period.transactionsSum}/>
                                                </Link>
                                            </TableCell>))}
                                        <TableCell><Curr input={subcategory.transactionsSum}/></TableCell>
                                        <TableCell><Curr input={subcategory.transactionsAvg}/></TableCell>
                                    </TableRow>
                                );
                            })}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}