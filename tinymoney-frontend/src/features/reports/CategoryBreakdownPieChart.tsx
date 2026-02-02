import {Pie, PieChart} from "recharts"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import type {ReportCategory} from "@/lib/api.ts";

const chartConfig = {
} satisfies ChartConfig

interface CategoryBreakdownPieChartProps {
    categories: ReportCategory[]
}

export function CategoryBreakdownPieChart({categories}: CategoryBreakdownPieChartProps) {
    const sortedCategories = 
        categories.length == 1 ? 
            categories.flatMap(c => c.subcategories).sort((a, b) => a.transactionsSum - b.transactionsSum).map((c, i) => ({...c, label: c.subcategoryName, fill: `var(--chart-${(i%5)+1})`})).sort(c => c.transactionsSum)
            : categories.sort((a, b) => a.transactionsSum - b.transactionsSum).map((c, i) => ({...c, label: c.categoryName, fill: `var(--chart-${(i%5)+1})`}));
    console.log(sortedCategories);
    return (
        <Card className="flex flex-col">
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
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
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
