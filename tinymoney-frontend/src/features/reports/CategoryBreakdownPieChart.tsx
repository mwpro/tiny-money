import {Pie, PieChart} from "recharts"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig, ChartLegend,
} from "@/components/ui/chart"
import type {ReportCategory} from "@/lib/api.ts";
import {SeriesColorPalette} from "@/features/reports/CategoryBreakdownBarChart.tsx";

const chartConfig = {
} satisfies ChartConfig

interface CategoryBreakdownPieChartProps {
    categories: ReportCategory[]
}

export function CategoryBreakdownPieChart({categories}: CategoryBreakdownPieChartProps) {
    const sortedCategories = 
        categories.length == 1 ? 
            categories.flatMap(c => c.subcategories)
                .map((c, index) => ({...c, label: c.subcategoryName, fill: SeriesColorPalette[index % SeriesColorPalette.length]}))
                .sort((a, b) => a.transactionsSum - b.transactionsSum)
            : categories
                .map((c, index) => ({...c, label: c.categoryName, fill: SeriesColorPalette[index % SeriesColorPalette.length]}))
                .sort((a, b) => a.transactionsSum - b.transactionsSum);
    return (
        <Card className="flex flex-col flex-1">
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel/>}
                        />
                        <Pie
                            data={sortedCategories}
                            dataKey="transactionsSum"
                            nameKey="label"
                            innerRadius={60}
                            startAngle={-270}
                        />
                        <ChartLegend  />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
