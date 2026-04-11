import {Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis} from "recharts";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {ChartContainer, type ChartConfig} from "@/components/ui/chart.tsx";
import {formatCurrencyAsString} from "@/components/Curr.tsx";
import type {SavingsReport} from "@/api/ApiTypes.ts";
import {CurrencyTooltip} from "@/features/reports/savings-report/CurrencyTooltip.tsx";

const emptyChartConfig = {} satisfies ChartConfig;

export function CashFlowsChart({data}: {data: SavingsReport["cashFlows"]}) {
    return (
        <Card className="flex flex-col flex-1">
            <CardHeader>
                <CardTitle>Przepływy miesięczne</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={emptyChartConfig}>
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
