import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {ReportCategory} from "@/api/ApiTypes.ts";
import {Fragment, useState} from "react";
import {Link} from "react-router-dom";
import {endOfMonth, endOfYear, parse} from "date-fns";
import {ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";
import type {ReportSettings} from "@/features/reports/summary-report/SummaryReportPage.tsx";
import {getTransactionsUrl} from "@/lib/utils.ts";
import {ComparisonTooltip} from "@/features/reports/summary-report/ComparisonTooltip.tsx";

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
                            {categories.length > 1 && <TableRow key={category.categoryId} className="bg-muted">
                                <TableCell onClick={() => setExpandedCategory(prev => prev !== category.categoryId ? category.categoryId : undefined)}
                                           className="font-bold">{category.categoryName}</TableCell>
                                {category.periods.map(period => (<TableCell key={period.periodLabel} className="text-right">
                                    <ComparisonTooltip
                                        current={period.transactionsSum}
                                        yoySum={period.yoySum}
                                        momSum={period.momSum}
                                        periodLabel={period.periodLabel}
                                        splitByMonth={reportSettings.splitByMonth}>
                                        <Curr input={period.transactionsSum}/>
                                    </ComparisonTooltip>
                                </TableCell>))}
                                <TableCell><Curr input={category.transactionsSum}/></TableCell>
                                <TableCell><Curr input={category.transactionsAvg}/></TableCell>
                            </TableRow>}
                            {(categories.length == 1 || expandedCategory == category.categoryId) && category.subcategories.map(subcategory => {
                                return (
                                    <TableRow key={`${category.categoryId}-${subcategory.subcategoryId}`}>
                                        <TableCell>
                                            <Link
                                                to={getTransactionsUrl({subcategoryId: subcategory.subcategoryId, dateFrom: reportSettings.dateFrom!, dateTo: reportSettings.dateTo!})}
                                                target={"_blank"}>
                                                <ListIcon className="inline pr-1" size={19}/>
                                            </Link>
                                            {subcategory.subcategoryName}
                                        </TableCell>
                                        {subcategory.periods.map(period => (
                                            <TableCell key={period.periodLabel} className="text-right">
                                                <ComparisonTooltip
                                                    current={period.transactionsSum}
                                                    yoySum={period.yoySum}
                                                    momSum={period.momSum}
                                                    periodLabel={period.periodLabel}
                                                    splitByMonth={reportSettings.splitByMonth}>
                                                    <Link
                                                        to={getTransactionsUrl({subcategoryId: subcategory.subcategoryId, dateFrom: parse(period.periodLabel, reportSettings.splitByMonth ? "yyyy-MM" : "yyyy", new Date()), dateTo: reportSettings.splitByMonth ? endOfMonth(parse(period.periodLabel, "yyyy-MM", new Date())) : endOfYear(parse(period.periodLabel, "yyyy", new Date()))})}
                                                        target={"_blank"}>
                                                        <Curr input={period.transactionsSum}/>
                                                    </Link>
                                                </ComparisonTooltip>
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
