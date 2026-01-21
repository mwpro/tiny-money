import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget} from "@/lib/api.ts";
import {Fragment} from "react";
import {BudgetAmountInput} from "@/features/budgets/BudgetAmountInput.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {BudgetNotesInput} from "@/features/budgets/BudgetNotesInput.tsx";

interface BudgetTableProps {
    budget: Budget,
    budgetPeriod: MonthSelection
}

export function BudgetTable({budget, budgetPeriod}: BudgetTableProps) {
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
                                    {new Intl.NumberFormat('pl-PL', {
                                        style: 'currency',
                                        currency: 'PLN'
                                    }).format(categoryBudget.amount)}
                                </TableCell>
                                <TableCell className={`text-right font-mono`}>
                                    {new Intl.NumberFormat('pl-PL', {
                                        style: 'currency',
                                        currency: 'PLN'
                                    }).format(categoryBudget.usedAmount)}
                                </TableCell>
                                <TableCell
                                    className={`text-right font-mono ${(categoryBudget.amount && categoryBudget.amountLeft >= 0) && "text-green-600"} ${(categoryBudget.amountLeft < 0 && "text-red-600")}`}>
                                    {new Intl.NumberFormat('pl-PL', {
                                        style: 'currency',
                                        currency: 'PLN'
                                    }).format(categoryBudget.amountLeft)}
                                </TableCell>
                            </TableRow>
                            {categoryBudget.subcategoryBudgets.map(subcategoryBudget => {
                                return (
                                    <TableRow key={`${categoryBudget.categoryId}-${subcategoryBudget.subcategoryId}`}
                                              className={!subcategoryBudget.amount && !subcategoryBudget.amountLeft ? "text-gray-400" : ""}>
                                        <TableCell>{subcategoryBudget.subcategoryName}</TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            <BudgetAmountInput budget={subcategoryBudget} budgetPeriod={budgetPeriod}/>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(subcategoryBudget.usedAmount)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono ${(subcategoryBudget.amount && subcategoryBudget.amountLeft >= 0) && "text-green-600"} ${(subcategoryBudget.amountLeft < 0 && "text-red-600")}`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(subcategoryBudget.amountLeft)}
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
                            {new Intl.NumberFormat('pl-PL', {
                                style: 'currency',
                                currency: 'PLN'
                            }).format(budget.monthlyBudget.amount)}
                        </TableCell>
                        <TableCell className={`text-right font-mono`}>
                            {new Intl.NumberFormat('pl-PL', {
                                style: 'currency',
                                currency: 'PLN'
                            }).format(budget.monthlyBudget.usedAmount)}
                        </TableCell>
                        <TableCell
                            className={`text-right font-mono ${(budget.monthlyBudget.amount && budget.monthlyBudget.amountLeft >= 0) && "text-green-600"} ${(budget.monthlyBudget.amountLeft < 0 && "text-red-600")}`}>
                            {new Intl.NumberFormat('pl-PL', {
                                style: 'currency',
                                currency: 'PLN'
                            }).format(budget.monthlyBudget.amountLeft)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}