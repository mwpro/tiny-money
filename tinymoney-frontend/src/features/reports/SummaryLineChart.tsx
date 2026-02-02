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
    type ChartConfig, ChartLegend, ChartLegendContent,
} from "@/components/ui/chart"

interface SummaryLineChartProps {
    reportPeriods: ReportPeriod[],
    splitByMonth?: boolean
}

const chartConfig = {
    incomesSum: {
        label: "Przychody",
        color: "var(--chart-1)",
    },
    expensesSum: {
        label: "Wydatki",
        color: "var(--chart-2)",
    },
    balance: {
        label: "Bilans",
        color: "var(--chart-3)",
    },
    budget: {
        label: "Budżet",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

export function SummaryLineChart({reportPeriods, splitByMonth}: SummaryLineChartProps) {
    return (
        <Card>
            <CardContent>
                <ChartContainer config={chartConfig} className={"max-h-80 w-full"}>
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
                        <ChartLegend content={<ChartLegendContent/>}/>
                        <Line
                            dataKey="incomesSum"
                            type="monotone"
                            strokeWidth={2}
                            stroke={"var(--chart-2)"}
                            dot={false}
                        />
                        <Line
                            dataKey="expensesSum"
                            type="monotone"
                            strokeWidth={2}
                            stroke={"var(--chart-1)"}
                            dot={false}
                        />
                        <Line
                            dataKey="balance"
                            type="monotone"
                            strokeWidth={2}
                            stroke={"var(--chart-3)"}
                            dot={false}
                        />
                        {/*todo, decyzja: czy/kiedy pokazywać budżet na wykresie/tabeli*/}
                        { splitByMonth && <Line
                            dataKey="budget"
                            type="monotone"
                            strokeWidth={2}
                            stroke={"var(--chart-4)"}
                            dot={false}
                        /> }
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
