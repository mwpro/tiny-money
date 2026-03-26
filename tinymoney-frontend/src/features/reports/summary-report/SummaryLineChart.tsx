import type {ReportPeriod} from "@/api/ApiTypes.ts";
import {CartesianGrid, Line, LineChart, type TooltipProps, XAxis, YAxis} from "recharts"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartLegend,
} from "@/components/ui/chart"
import {useState} from "react";
import type {NameType, ValueType} from "recharts/types/component/DefaultTooltipContent";

function SummaryTooltip({active, payload, label}: TooltipProps<ValueType, NameType>) {
    if (!active || !payload?.length) return null;
    return (
        <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
            <div className="font-medium">{label}</div>
            <div className="grid gap-1.5">
                {payload.map((item: any) => (
                    <div key={item.dataKey} className="flex w-full items-center gap-2">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: item.color}}/>
                        <div className="flex flex-1 justify-between leading-none items-center gap-4">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="text-foreground font-mono font-medium tabular-nums">
                                {item.dataKey === "savingsRate"
                                    ? `${Number(item.value).toFixed(1)}%`
                                    : Number(item.value).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface SummaryLineChartProps {
    reportPeriods: ReportPeriod[],
    splitByMonth?: boolean
}

export function SummaryLineChart({reportPeriods, splitByMonth}: SummaryLineChartProps) {
    const [activeSeries, setActiveSeries] = useState(Object.keys(reportPeriods[0]));

    return (
        <Card className={"mb-3"}>
            <CardContent>
                <ChartContainer config={{}} className={"h-80 w-full"}>
                    <LineChart
                        accessibilityLayer
                        data={reportPeriods}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false}/>
                        <XAxis
                            dataKey="periodLabel"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval={"preserveStartEnd"}
                        />
                        <YAxis yAxisId="left" domain={([dataMin, dataMax]) => {
                            const min = Math.min(dataMin, 0);
                            const max = Math.ceil(dataMax / 1000) * 1000 + 1000;
                            return [min, max];
                        }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                        <ChartTooltip cursor={false} content={<SummaryTooltip/>}/>
                        <ChartLegend  onClick={(d, _, e) => {
                            const seriesKey = d.dataKey;
                            if (!seriesKey || typeof seriesKey !== "string") {
                                return;
                            }

                            setActiveSeries(prev => {
                                if (e.ctrlKey) {
                                    if (prev.includes(seriesKey)) {
                                        return prev.filter(c => c !== seriesKey);
                                    } else {
                                        return [...prev, seriesKey]
                                    }
                                }
                                if (prev.includes(seriesKey) && prev.length == 1) {
                                    return Object.keys(reportPeriods[0]);
                                }
                                return [seriesKey];
                            });
                        }}  />
                        <Line
                            yAxisId="left"
                            dataKey="incomesSum"
                            type="monotone"
                            name="Przychody"
                            strokeWidth={2}
                            stroke="#52b788"
                            dot={false}
                            hide={!activeSeries.includes("incomesSum")}
                        />
                        <Line
                            yAxisId="left"
                            dataKey="expensesSum"
                            type="monotone"
                            name="Wydatki"
                            strokeWidth={2}
                            stroke="#e07060"
                            dot={false}
                            hide={!activeSeries.includes("expensesSum")}
                        />
                        <Line
                            yAxisId="left"
                            dataKey="balance"
                            type="monotone"
                            name="Bilans"
                            strokeWidth={2}
                            stroke="#5e9abf"
                            dot={false}
                            hide={!activeSeries.includes("balance")}
                        />
                        { splitByMonth && <Line
                            yAxisId="left"
                            dataKey="budget"
                            type="monotone"
                            name="Budżet"
                            strokeWidth={2}
                            stroke="#c9a96e"
                            dot={false}
                            hide={!activeSeries.includes("budget")}
                        /> }
                        <Line
                            yAxisId="right"
                            dataKey="savingsRate"
                            type="monotone"
                            name="Stopa oszczędności"
                            strokeWidth={2}
                            stroke="#a78bfa"
                            dot={false}
                            hide={!activeSeries.includes("savingsRate")}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
