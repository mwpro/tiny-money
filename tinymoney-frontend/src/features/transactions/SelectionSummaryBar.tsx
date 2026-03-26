import {useMemo} from "react";
import {type Transaction} from "@/api/ApiTypes.ts";
import {Curr} from "@/components/Curr.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Trash2} from "lucide-react";

interface SelectionSummaryBarProps {
    selectedIds: Set<number>
    transactions: Transaction[]
    onDelete: () => void
}

export function SelectionSummaryBar({selectedIds, transactions, onDelete}: SelectionSummaryBarProps) {
    const summary = useMemo(() => {
        const selected = transactions.filter(t => selectedIds.has(t.id))
        const expenses = selected.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0)
        const income = selected.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0)
        const balance = income - expenses
        const hasExpenses = selected.some(t => t.isExpense)
        const hasIncome = selected.some(t => !t.isExpense)
        return {expenses, income, balance, hasExpenses, hasIncome}
    }, [selectedIds, transactions])

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4 rounded-xl border bg-background shadow-lg px-5 py-3 text-sm">
                <span className="font-medium text-muted-foreground">
                    {selectedIds.size} {selectedIds.size === 1 ? "zaznaczona" : "zaznaczonych"}
                </span>
                {summary.hasExpenses && (
                    <>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-muted-foreground">Wydatki: <Curr input={-summary.expenses} colored /></span>
                    </>
                )}
                {summary.hasIncome && (
                    <>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-muted-foreground">Przychody: <Curr input={summary.income} colored /></span>
                    </>
                )}
                {summary.hasExpenses && summary.hasIncome && (
                    <>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-muted-foreground">Bilans: <Curr input={summary.balance} colored /></span>
                    </>
                )}
                <div className="h-4 w-px bg-border" />
                <Button size="sm" variant="destructive" onClick={onDelete}>
                    <Trash2 />
                    Usuń
                </Button>
            </div>
        </div>
    )
}
