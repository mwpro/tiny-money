import {cn} from "@/lib/utils.ts";

interface PlanProgressBarProps {
    spent: number;
    budget: number;
    className?: string;
    showPercent?: boolean;
}

export function PlanProgressBar({spent, budget, className, showPercent = true}: PlanProgressBarProps) {
    const rawPct = budget > 0 ? (spent / budget) * 100 : 0;
    const barPct = Math.min(100, rawPct);
    const isOver = spent > budget;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", isOver ? "bg-expense" : "bg-income")}
                    style={{width: `${barPct}%`}}
                />
            </div>
            {showPercent && (
                <span className={cn("text-xs tabular-nums w-9 text-right shrink-0", isOver ? "text-expense" : "text-income")}>
                    {Math.round(rawPct)}%
                </span>
            )}
        </div>
    );
}
