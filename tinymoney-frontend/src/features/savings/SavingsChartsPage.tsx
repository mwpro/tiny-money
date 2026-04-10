import {useQuery} from "@tanstack/react-query";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {ChartContainer, ChartLegend, type ChartConfig} from "@/components/ui/chart.tsx";
import {
    Area,
    AreaChart,
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {SeriesColorPalette} from "@/features/reports/summary-report/CategoryBreakdownBarChart.tsx";
import {formatCurrencyAsString} from "@/components/Curr.tsx";
import type {SavingsReport} from "@/api/ApiTypes.ts";
import {useState} from "react";
import {SavingsReportTable} from "@/features/savings/SavingsReportTable.tsx";

const emptyChartConfig = {} satisfies ChartConfig;

 function CurrencyTooltip({active, payload, label, showTotal}: any) {
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

function ByCategoryChart({data}: {data: SavingsReport["byCategory"]}) {
    const periods = [...new Set(data.map(d => d.period))].sort();
    const categories = [...new Map(data.map(d => [d.categoryId, {id: d.categoryId, name: d.categoryName}])).values()]
        .sort((a, b) => a.id - b.id);

    const allKeys = categories.map(cat => `cat_${cat.id}`);
    const [activeCategories, setActiveCategories] = useState(allKeys);

    const balanceByPeriodAndCategory = new Map(data.map(d => [`${d.period}:${d.categoryId}`, d.balance]));
    const chartData = periods.map(period => {
        const row: Record<string, any> = {period};
        for (const cat of categories) {
            row[`cat_${cat.id}`] = balanceByPeriodAndCategory.get(`${period}:${cat.id}`) ?? 0;
        }
        return row;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Struktura oszczędności</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={emptyChartConfig} className="h-72 w-full">
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="period" tick={{fontSize: 12}}/>
                        <YAxis tickFormatter={(v) => formatCurrencyAsString(v)} width={100} tick={{fontSize: 11}}/>
                        <Tooltip content={<CurrencyTooltip showTotal/>}/>
                        <ChartLegend onClick={(d, _, e) => {
                            const key = d.dataKey;
                            if (!key || typeof key !== "string") return;
                            setActiveCategories(prev => {
                                if (e.ctrlKey) {
                                    return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
                                }
                                if (prev.includes(key) && prev.length === 1) return allKeys;
                                return [key];
                            });
                        }}/>
                        {categories.map((cat, i) => (
                            <Area
                                key={cat.id}
                                type="monotone"
                                dataKey={`cat_${cat.id}`}
                                name={cat.name}
                                stackId="1"
                                stroke={SeriesColorPalette[i % SeriesColorPalette.length]}
                                fill={SeriesColorPalette[i % SeriesColorPalette.length]}
                                fillOpacity={0.6}
                                hide={!activeCategories.includes(`cat_${cat.id}`)}
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function CashFlowsChart({data}: {data: SavingsReport["cashFlows"]}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Przepływy miesięczne</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={emptyChartConfig} className="h-72 w-full">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="period" tick={{fontSize: 12}}/>
                        <YAxis tickFormatter={(v) => formatCurrencyAsString(v)} width={100} tick={{fontSize: 11}}/>
                        <Tooltip content={<CurrencyTooltip/>}/>
                        <Bar dataKey="deposited" name="Wpłaty" fill="#52b788"/>
                        <Bar dataKey="withdrawn" name="Wypłaty" fill="#e07060"/>
                        <Line type="monotone" dataKey="netGain" name="Zysk" stroke="#5e9abf" dot={true} strokeWidth={2}/>
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export function SavingsChartsPage() {
    const {savingsClient} = useApiClient();
    const {data, isLoading} = useQuery({
        queryKey: ["savings-report"],
        queryFn: () => savingsClient.getReport(),
    });

    if (isLoading || !data) return null;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ByCategoryChart data={data.byCategory}/>
                <CashFlowsChart data={data.cashFlows}/>
            </div>
            <SavingsReportTable tableData={data.tableData}/>
        </>
    );
}
