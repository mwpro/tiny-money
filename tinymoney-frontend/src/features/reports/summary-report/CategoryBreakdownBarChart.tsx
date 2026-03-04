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
import type {ReportCategory} from "@/api/ApiTypes.ts";
import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";
import {useState} from "react";

const chartConfig = {
} satisfies ChartConfig

interface CategoryBreakdownPieChartProps {
    categories: ReportCategory[]
}

export const SeriesColorPalette = [
    "#52b788", "#e9c46a", "#d07060", "#3abfbf", "#9abb58",
    "#e8a042", "#5e9abf", "#c8d460", "#e07878", "#6ac8a0",
    "#d4a840", "#68a0d0", "#a8c050", "#d88050", "#78b8d8",
    "#b8d870", "#c88090", "#48b8a8", "#e8b860", "#88c8a0",
    "#5898c8", "#d8c050", "#b88090", "#68b870", "#d89858",
    "#9098d0", "#a8d068", "#c88858", "#60a8d8", "#d8c098"
];


export function CategoryBreakdownBarChart({categories}: CategoryBreakdownPieChartProps) {
    let chartData: { [p: string]: any }[];
    let categoryNames: string[];
    if (categories.length == 1) {
        const subcategories = categories[0].subcategories;
        chartData = Array.from(
            new Set(subcategories.flatMap(cat => cat.periods.map(p => p.periodLabel)))
        ).sort().map(period => {
            const row: {[index: string]:any} = { periodLabel: period };
            subcategories.forEach(category => {
                const periodData = category.periods.find(p => p.periodLabel === period);
                row[category.subcategoryName] = periodData ? periodData.transactionsSum : 0;
            });
            return row;
        });
        categoryNames = subcategories.map(cat => cat.subcategoryName);
    } else {
        chartData = Array.from(
            new Set(categories.flatMap(cat => cat.periods.map(p => p.periodLabel)))
        ).sort().map(period => {
            const row: {[index: string]:any} = { periodLabel: period };
            categories.forEach(category => {
                const periodData = category.periods.find(p => p.periodLabel === period);
                row[category.categoryName] = periodData ? periodData.transactionsSum : 0;
            });
            return row;
        });
        categoryNames = categories.map(cat => cat.categoryName);
    }
    const [activeCategories, setActiveCategories] = useState(categoryNames);
    return (
        <Card className={"flex-2"}>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="periodLabel"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend onClick={(d, _, e) => {
                            const categoryKey = d.dataKey;
                            if (!categoryKey || typeof categoryKey !== "string") {
                                return;
                            }
                            
                            setActiveCategories(prev => { 
                                if (e.ctrlKey) {
                                    if (prev.includes(categoryKey)) {
                                        return prev.filter(c => c !== categoryKey);
                                    } else {
                                        return [...prev, categoryKey]
                                    }
                                }
                                if (prev.includes(categoryKey) && prev.length == 1) {
                                    return categoryNames;
                                } 
                                return [categoryKey];
                            });
                        }} />
                        {categoryNames.map((categoryName, index) => (
                            <Bar
                                key={categoryName}
                                hide={!activeCategories.includes(categoryName)}
                                dataKey={categoryName}
                                stackId="a"
                                name={categoryName}
                                fill={SeriesColorPalette[index % SeriesColorPalette.length]}
                            />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
