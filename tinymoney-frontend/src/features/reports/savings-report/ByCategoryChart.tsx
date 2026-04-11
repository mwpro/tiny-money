import {useState} from "react";
import {Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis} from "recharts";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {ChartContainer, ChartLegend, type ChartConfig} from "@/components/ui/chart.tsx";
import {SeriesColorPalette} from "@/features/reports/summary-report/CategoryBreakdownBarChart.tsx";
import {formatCurrencyAsString} from "@/components/Curr.tsx";
import type {SavingsReport} from "@/api/ApiTypes.ts";
import {CurrencyTooltip} from "@/features/reports/savings-report/CurrencyTooltip.tsx";

const emptyChartConfig = {} satisfies ChartConfig;

export function ByCategoryChart({data}: {data: SavingsReport["byCategory"]}) {
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
