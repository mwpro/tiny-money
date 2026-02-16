import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, SubcategoryBudgetSuggestions} from "@/lib/api.ts";
import {Fragment} from "react";
import {BudgetAmountInput} from "@/features/budgets/BudgetAmountInput.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {BudgetNotesInput} from "@/features/budgets/BudgetNotesInput.tsx";
import {Link} from "react-router-dom";
import {endOfMonth, startOfMonth} from "date-fns";
import {ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";
import {getTransactionsUrl} from "@/lib/utils.ts";

interface BudgetTableProps {
    budget: Budget,
    budgetPeriod: MonthSelection,
    budgetSuggestions: SubcategoryBudgetSuggestions[]
}

export function BudgetTable({budget, budgetPeriod, budgetSuggestions}: BudgetTableProps) {
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead className="text-right">Plan</TableHead>
                        <TableHead className="text-right">Realizacja</TableHead>
                        <TableHead className="text-right">Różnica</TableHead>
                        <TableHead>Notatki</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {budget.monthlyBudget.categoryBudgets.map((categoryBudget) => (
                        <Fragment key={categoryBudget.categoryId}>
                            <TableRow className={`font-bold ${!categoryBudget.amount && !categoryBudget.amountLeft ? "text-gray-400" : ""} bg-gray-100`}>
                                <TableCell>{categoryBudget.categoryName}</TableCell>
                                <TableCell className="text-right">
                                    <Curr input={categoryBudget.amount} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Curr input={categoryBudget.usedAmount} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Curr input={categoryBudget.amountLeft} colored={categoryBudget.amount !== 0 || categoryBudget.amountLeft !== 0} />
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            {categoryBudget.subcategoryBudgets.map(subcategoryBudget => {
                                return (
                                    <TableRow key={`${categoryBudget.categoryId}-${subcategoryBudget.subcategoryId}`}
                                              className={!subcategoryBudget.amount && !subcategoryBudget.amountLeft ? "text-gray-400" : ""}>
                                        <TableCell>
                                            <Link to={getTransactionsUrl({subcategoryId: subcategoryBudget.subcategoryId, dateFrom: startOfMonth(budgetPeriodReferenceDate), dateTo: endOfMonth(budgetPeriodReferenceDate)})} target={"_blank"}>
                                                <ListIcon className="inline pr-1" size={19} />
                                            </Link>
                                            {subcategoryBudget.subcategoryName}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <BudgetAmountInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} budgetSuggestions={budgetSuggestions.find(s => s.subcategoryId == subcategoryBudget.subcategoryId)}/>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Curr input={subcategoryBudget.usedAmount} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Curr input={subcategoryBudget.amountLeft} colored={subcategoryBudget.amount !== 0 || subcategoryBudget.amountLeft !== 0} />
                                        </TableCell>
                                        <TableCell><BudgetNotesInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} /></TableCell>
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