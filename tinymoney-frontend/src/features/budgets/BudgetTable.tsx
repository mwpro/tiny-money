import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, SubcategoryBudgetSuggestions} from "@/api/ApiTypes.ts";
import {Fragment, useState} from "react";
import {BudgetAmountInput} from "@/features/budgets/BudgetAmountInput.tsx";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {BudgetNotesInput} from "@/features/budgets/BudgetNotesInput.tsx";
import {Link} from "react-router-dom";
import {endOfMonth, startOfMonth} from "date-fns";
import {ChevronDown, ListIcon} from "lucide-react";
import {Curr} from "@/components/Curr.tsx";
import {getTransactionsUrl} from "@/lib/utils.ts";

interface BudgetTableProps {
    budget: Budget,
    budgetPeriod: MonthSelection,
    budgetSuggestions: SubcategoryBudgetSuggestions[]
}

export function BudgetTable({budget, budgetPeriod, budgetSuggestions}: BudgetTableProps) {
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    return (
        <>
            {/* Mobile card layout */}
            <div className="lg:hidden border rounded-md">
                {budget.monthlyBudget.categoryBudgets.map((categoryBudget) => {
                    const isExpanded = expandedCategories.has(categoryBudget.categoryId);
                    return (
                    <Fragment key={categoryBudget.categoryId}>
                        {/* Category section header — tap to expand/collapse */}
                        <button
                            className={`w-full text-left px-4 py-2.5 border-b last:border-b-0 ${!categoryBudget.amount && !categoryBudget.amountLeft ? "text-muted-foreground" : ""} bg-muted`}
                            onClick={() => toggleCategory(categoryBudget.categoryId)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <ChevronDown size={16} className={`transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                    <span className="font-semibold">{categoryBudget.categoryName}</span>
                                </div>
                                <span className="font-semibold"><Curr input={categoryBudget.amountLeft} colored={categoryBudget.amount !== 0 || categoryBudget.amountLeft !== 0} /></span>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 pl-5">
                                <span>Plan: <Curr input={categoryBudget.amount} /></span>
                                <span>Realizacja: <Curr input={categoryBudget.usedAmount} /></span>
                            </div>
                        </button>

                        {/* Subcategory cards — shown only when expanded */}
                        {isExpanded && categoryBudget.subcategoryBudgets.map(subcategoryBudget => (
                            <div key={`${categoryBudget.categoryId}-${subcategoryBudget.subcategoryId}`}
                                 className={`px-4 py-3 border-b last:border-b-0 ${!subcategoryBudget.amount && !subcategoryBudget.amountLeft ? "text-muted-foreground" : ""}`}>
                                <div className="flex items-center gap-1 font-medium mb-2">
                                    <Link to={getTransactionsUrl({subcategoryId: subcategoryBudget.subcategoryId, dateFrom: startOfMonth(budgetPeriodReferenceDate), dateTo: endOfMonth(budgetPeriodReferenceDate)})} target={"_blank"}>
                                        <ListIcon size={16} />
                                    </Link>
                                    {subcategoryBudget.subcategoryName}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Plan</div>
                                        <BudgetAmountInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} budgetSuggestions={budgetSuggestions.find(s => s.subcategoryId == subcategoryBudget.subcategoryId)}/>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground mb-1">Realizacja</div>
                                        <Curr input={subcategoryBudget.usedAmount} />
                                    </div>
                                </div>
                                {(subcategoryBudget.amount !== 0 || subcategoryBudget.amountLeft !== 0) && (
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-xs text-muted-foreground self-center">Różnica</span>
                                        <Curr input={subcategoryBudget.amountLeft} colored />
                                    </div>
                                )}
                                <BudgetNotesInput budget={subcategoryBudget} budgetPeriod={budgetPeriod} compact />
                            </div>
                        ))}
                    </Fragment>
                    );
                })}
            </div>

            {/* Desktop table layout */}
            <div className="hidden lg:block border rounded-md">
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
                                <TableRow className={`font-bold ${!categoryBudget.amount && !categoryBudget.amountLeft ? "text-muted-foreground" : ""} bg-muted`}>
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
                                                  className={!subcategoryBudget.amount && !subcategoryBudget.amountLeft ? "text-muted-foreground" : ""}>
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
        </>
    );
}