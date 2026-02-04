import type {ReportPeriod} from "@/lib/api.ts";
import {CartesianGrid, Line, LineChart, XAxis} from "recharts"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend, 
} from "@/components/ui/chart"
import {useState} from "react";
import {SeriesColorPalette} from "@/features/reports/CategoryBreakdownBarChart.tsx";

interface SummaryLineChartProps {
    reportPeriods: ReportPeriod[],
    splitByMonth?: boolean
}

export function SummaryLineChart({reportPeriods, splitByMonth}: SummaryLineChartProps) {
    const [activeSeries, setActiveSeries] = useState(Object.keys(reportPeriods[0]));
    console.log(activeSeries);
    return (
        <Card className={"mb-3"}>
            <CardContent>
                <ChartContainer config={{}} className={"max-h-80 w-full"}>
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
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent/>}/>
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
                            dataKey="incomesSum"
                            type="monotone"
                            name="Przychody"
                            strokeWidth={2}
                            stroke={SeriesColorPalette[1]}
                            dot={false}
                            hide={!activeSeries.includes("incomesSum")}
                        />
                        <Line
                            dataKey="expensesSum"
                            type="monotone"
                            name="Wydatki"
                            strokeWidth={2}
                            stroke={SeriesColorPalette[2]}
                            dot={false}
                            hide={!activeSeries.includes("expensesSum")}
                        />
                        <Line
                            dataKey="balance"
                            type="monotone"
                            name="Bilans"
                            strokeWidth={2}
                            stroke={SeriesColorPalette[0]}
                            dot={false}
                            hide={!activeSeries.includes("balance")}
                        />
                        { splitByMonth && <Line
                            dataKey="budget"
                            type="monotone"
                            name="Budżet"
                            strokeWidth={2}
                            stroke={SeriesColorPalette[3]}
                            dot={false}
                            hide={!activeSeries.includes("budget")}
                        /> }
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
