import {formatCurrencyAsString} from "@/components/Curr.tsx";

export function CurrencyTooltip({active, payload, label, showTotal}: any) {
    if (!active || !payload?.length) return null;
    const total = showTotal ? payload.reduce((sum: number, item: any) => sum + (item.value ?? 0), 0) : null;
    return (
        <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
            <div className="font-medium">{label}</div>
            {payload.map((item: any) => (
                <div key={item.dataKey} className="flex w-full items-center gap-2">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: item.color ?? item.fill}}/>
                    <div className="flex flex-1 justify-between leading-none items-center gap-4">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">{formatCurrencyAsString(item.value)}</span>
                    </div>
                </div>
            ))}
            {total !== null && (
                <div className="border-t border-border/50 mt-0.5 pt-1.5 flex w-full justify-between leading-none items-center gap-4">
                    <span className="font-medium">Łącznie</span>
                    <span className="font-mono font-semibold tabular-nums">{formatCurrencyAsString(total)}</span>
                </div>
            )}
        </div>
    );
}
