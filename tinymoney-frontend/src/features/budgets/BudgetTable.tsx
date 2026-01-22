import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, SubcategoryBudgetSuggestions} from "@/lib/api.ts";
import {Fragment} from "react";
import {BudgetAmountInput} from "@/features/budgets/BudgetAmountInput.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {BudgetNotesInput} from "@/features/budgets/BudgetNotesInput.tsx";
import {curr} from "@/lib/utils.ts";
import {Link} from "react-router-dom";
import {endOfMonth, format, startOfMonth} from "date-fns";

interface BudgetTableProps {
    budget: Budget,
    budgetPeriod: MonthSelection,
    budgetSuggestions: SubcategoryBudgetSuggestions[]
}

export function BudgetTable({budget, budgetPeriod, budgetSuggestions}: BudgetTableProps) {
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    const transactionsListPath = `/transactions?dateFrom=${format(startOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}&`
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead className={`text-right`}>Plan</TableHead>
                        <TableHead className={`text-right`}>Realizacja</TableHead>
                        <TableHead className={`text-right`}>Różnica</TableHead>
                        <TableHead>Notatki</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {budget.monthlyBudget.categoryBudgets.map((categoryBudget) => (
                        <Fragment key={categoryBudget.categoryId}>
                            <TableRow className={`font-bold ${!categoryBudget.amount && !categoryBudget.amountLeft ? "text-gray-400" : ""}`}>
                                <TableCell>{categoryBudget.categoryName}</TableCell>
                                <TableCell className={`text-right font-mono`}>
                                    {curr(categoryBudget.amount)}
                                </TableCell>
                                <TableCell className={`text-right font-mono`}>
                                    {curr(categoryBudget.usedAmount)}
                                </TableCell>
                                <TableCell
                                    className={`text-right font-mono ${(categoryBudget.amount && categoryBudget.amountLeft >= 0) && "text-green-600"} ${(categoryBudget.amountLeft < 0 && "text-red-600")}`}>
                                    {curr(categoryBudget.amountLeft)}
                                </TableCell>
                            </TableRow>
                            {categoryBudget.subcategoryBudgets.map(subcategoryBudget => {
                                return (
                                    <TableRow key={`${categoryBudget.categoryId}-${subcategoryBudget.subcategoryId}`}
                                              className={!subcategoryBudget.amount && !subcategoryBudget.amountLeft ? "text-gray-400" : ""}>
                                        <TableCell>
                                            <Link to={`${transactionsListPath}&subcategoryId=${subcategoryBudget.subcategoryId}`} target={"_blank"}>
                                                {subcategoryBudget.subcategoryName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            <BudgetAmountInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} budgetSuggestions={budgetSuggestions.find(s => s.subcategoryId == subcategoryBudget.subcategoryId)}/>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            {curr(subcategoryBudget.usedAmount)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono ${(subcategoryBudget.amount && subcategoryBudget.amountLeft >= 0) && "text-green-600"} ${(subcategoryBudget.amountLeft < 0 && "text-red-600")}`}>
                                            {curr(subcategoryBudget.amountLeft)}
                                        </TableCell>
                                        <TableCell><BudgetNotesInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} /></TableCell>
                                    </TableRow>
                                );
                            })}
                        </Fragment>
                    ))}
                </TableBody>

                <TableFooter>
                    <TableRow className={`font-bold ${!budget.monthlyBudget.amount && !budget.monthlyBudget.amountLeft ? "text-gray-400" : ""}`}>
                        <TableCell />
                        <TableCell className={`text-right font-mono`}>
                            {curr(budget.monthlyBudget.amount)}
                        </TableCell>
                        <TableCell className={`text-right font-mono`}>
                            {curr(budget.monthlyBudget.usedAmount)}
                        </TableCell>
                        <TableCell
                            className={`text-right font-mono ${(budget.monthlyBudget.amount && budget.monthlyBudget.amountLeft >= 0) && "text-green-600"} ${(budget.monthlyBudget.amountLeft < 0 && "text-red-600")}`}>
                            {curr(budget.monthlyBudget.amountLeft)}
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}