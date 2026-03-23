import React from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {formatCurrencyAsString} from "@/components/Curr.tsx";
import {format, parse, subMonths, subYears} from "date-fns";

interface ComparisonTooltipProps {
    current: number;
    yoySum?: number | null;
    momSum?: number | null;
    periodLabel: string;
    splitByMonth: boolean;
    lowerIsBetter?: boolean;
    children: React.ReactNode;
}

function getYoyLabel(periodLabel: string, splitByMonth: boolean): string {
    if (splitByMonth) {
        return format(subYears(parse(periodLabel, "yyyy-MM", new Date()), 1), "yyyy-MM");
    }
    return (parseInt(periodLabel) - 1).toString();
}

function getMomLabel(periodLabel: string): string {
    return format(subMonths(parse(periodLabel, "yyyy-MM", new Date()), 1), "yyyy-MM");
}

function DeltaLine({current, comparison, comparisonLabel, periodKind, lowerIsBetter}: {
    current: number;
    comparison: number;
    comparisonLabel: string;
    periodKind: string;
    lowerIsBetter: boolean;
}) {
    const delta = current - comparison;
    const sign = delta >= 0 ? "+" : "";
    const deltaFormatted = sign + formatCurrencyAsString(delta);

    let pctText = "";
    if (comparison !== 0) {
        const pct = (delta / Math.abs(comparison)) * 100;
        const pctSign = pct >= 0 ? "+" : "";
        pctText = ` (${pctSign}${pct.toFixed(0)}%)`;
    }

    const isPositive = lowerIsBetter ? delta <= 0 : delta >= 0;
    const colorClass = isPositive ? "text-green-400 dark:text-green-700" : "text-red-400 dark:text-red-600";

    return (
        <>
            <p>{comparisonLabel}: {formatCurrencyAsString(comparison)}</p>
            <p className={colorClass}>{deltaFormatted}{pctText} {periodKind}</p>
        </>
    );
}

export function ComparisonTooltip({current, yoySum, momSum, periodLabel, splitByMonth, lowerIsBetter = false, children}: ComparisonTooltipProps) {
    if (yoySum == null && momSum == null) {
        return <>{children}</>;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline">{children}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono">
                {yoySum != null && (
                    <DeltaLine
                        current={current}
                        comparison={yoySum}
                        comparisonLabel={getYoyLabel(periodLabel, splitByMonth)}
                        periodKind="r/r"
                        lowerIsBetter={lowerIsBetter}
                    />
                )}
                {momSum != null && (
                    <DeltaLine
                        current={current}
                        comparison={momSum}
                        comparisonLabel={getMomLabel(periodLabel)}
                        periodKind="m/m"
                        lowerIsBetter={lowerIsBetter}
                    />
                )}
            </TooltipContent>
        </Tooltip>
    );
}
