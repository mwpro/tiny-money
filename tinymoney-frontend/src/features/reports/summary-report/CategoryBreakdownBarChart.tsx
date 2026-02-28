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
    "#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed",
    "#0891b2", "#4b5563", "#db2777", "#ea580c", "#9333ea",
    "#60a5fa", "#4ade80", "#f87171", "#fbbf24", "#a78bfa",
    "#22d3ee", "#9ca3af", "#f472b6", "#fb923c", "#c084fc",
    "#1e40af", "#166534", "#991b1b", "#92400e", "#5b21b6",
    "#155e75", "#1f2937", "#9d174d", "#9a3412", "#6b21a8"
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
