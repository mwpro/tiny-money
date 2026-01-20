import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, Category} from "@/lib/api.ts";
import {Fragment} from "react";
import {BudgetAmountInput} from "@/features/budgets/BudgetAmountInput.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";

interface TransactionsTableProps {
    categories: Category[],
    budget: Budget,
    budgetPeriod: MonthSelection
}


export function BudgetTable({categories, budget, budgetPeriod}: TransactionsTableProps) {
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
                    {categories.map((category) => (
                        <Fragment key={category.id}>
                            <TableRow className={"font-bold"}>
                                <TableCell>{category.name}</TableCell>
                            </TableRow>
                            {category.subcategories.map(subcategory => {
                                const budgetForSubcategory = budget.budgetEntries.find(b => b.subcategoryId === subcategory.id) || {
                                    subcategoryId: subcategory.id,
                                    amount: 0,
                                    usedAmount: 0,
                                    notes: undefined
                                };
                                const budgetRealization = budgetForSubcategory.amount - budgetForSubcategory.usedAmount;

                                return (
                                    <TableRow key={`${category.id}-${subcategory.id}`}
                                              className={!budgetForSubcategory.amount ? "text-gray-400" : ""}>
                                        <TableCell>{subcategory.name}</TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            <BudgetAmountInput budgetPeriod={budgetPeriod} budget={budgetForSubcategory}/>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(budgetForSubcategory.usedAmount)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono ${(budgetForSubcategory.amount && budgetRealization >= 0) && "text-green-600"} ${(budgetRealization < 0 && "text-red-600")}`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(budgetRealization)}
                                        </TableCell>
                                        <TableCell>{budgetForSubcategory.notes}</TableCell>
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