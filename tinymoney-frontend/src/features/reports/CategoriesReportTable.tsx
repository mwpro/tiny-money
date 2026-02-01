import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {ReportCategory} from "@/lib/api.ts";
import {Fragment, useState} from "react";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {Link} from "react-router-dom";
import {endOfMonth, format, startOfMonth} from "date-fns";
import {ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

interface BudgetTableProps {
    categories: ReportCategory[],
    budgetPeriod: MonthSelection
}

export function CategoriesReportTable({categories, budgetPeriod}: BudgetTableProps) {
    const [showSubcategories, setShowSubcategories] = useState(true)
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    const transactionsListPath = `/transactions?dateFrom=${format(startOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}`
    
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        {categories[0].periods.map(period => (<TableHead className="text-right">{period.periodLabel}</TableHead>))}
                        <TableHead>Suma</TableHead>
                        <TableHead>Średnia</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <Fragment key={category.categoryId}>
                            {categories.length > 1 && <TableRow key={category.categoryId}>
                                <TableCell onClick={() => setShowSubcategories(v => !v)} className={`font-bold`}>{category.categoryName}</TableCell>
                                {category.periods.map(period => (<TableCell className="text-right"><Curr input={period.transactionsSum}/></TableCell>))}
                                <TableCell><Curr input={category.transactionsSum}/></TableCell>
                                <TableCell><Curr input={category.transactionsAvg}/></TableCell>
                            </TableRow>}
                            {(categories.length == 1 || showSubcategories) && category.subcategories.map(subcategory => {
                                return (
                                    <TableRow key={`${category.categoryId}-${subcategory.subcategoryId}`}>
                                        <TableCell>
                                            <Link to={`${transactionsListPath}&subcategoryId=${subcategory.subcategoryId}`}
                                                  target={"_blank"}>
                                                <ListIcon className="inline pr-1" size={19}/>
                                            </Link>
                                            {subcategory.subcategoryName}
                                        </TableCell>
                                        {subcategory.periods.map(period => (
                                            <TableCell className="text-right">
                                                <Tooltip>
                                                    <TooltipTrigger className={"underline"} style={
                                                        {
                                                            "textDecorationStyle": "dashed",
                                                            // "textDecorationColor": 100 ? "var(--chart-2)": "var(--color-destructive)"
                                                            "textDecorationColor": "var(--chart-2)"
                                                        }
                                                    }>
                                                        <Curr input={period.transactionsSum}/>
                                                    </TooltipTrigger>
                                                    <TooltipContent side={"bottom"} className={"font-mono"}>
                                                        <p>+<Curr input={12} /> (+12%) r/r</p>
                                                        <p>2024: <Curr input={125} /></p>
                                                    </TooltipContent>
                                                </Tooltip>
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