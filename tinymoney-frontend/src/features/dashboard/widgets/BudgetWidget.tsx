import {Link} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip} from "recharts";
import type {TooltipProps} from "recharts";
import type {DailyExpense} from "@/api/ApiTypes.ts";

type SparklinePoint = { day: number; actual: number | null; projected: number | null };

function buildSparklineData(dailyExpenses: DailyExpense[], budget: number, today: number, daysInMonth: number): SparklinePoint[] {
    const map = new Map(dailyExpenses.map(d => [d.day, d]));
    const data: SparklinePoint[] = Array.from({length: daysInMonth + 1}, (_, i) => ({day: i, actual: null, projected: null}));

    data[0].actual = budget;
    for (let d = 1; d <= today; d++) {
        const entry = map.get(d);
        data[d].actual = entry ? entry.budgetLeft : (data[d - 1].actual ?? budget);
    }

    const lastActual = data[today].actual ?? budget;
    const totalSpent = budget - lastActual;
    const dailyRate = today > 0 ? totalSpent / today : 0;
    data[today].projected = lastActual;
    for (let d = today + 1; d <= daysInMonth; d++) {
        data[d].projected = lastActual - dailyRate * (d - today);
    }
    return data;
}

function CustomTooltip({active, payload, label}: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    const value = payload.find(p => p.dataKey === 'actual')?.value ?? payload.find(p => p.dataKey === 'projected')?.value;
    if (value == null) return null;
    return (
        <div className="bg-popover text-popover-foreground border rounded px-2 py-1 text-xs shadow">
            Dzień {label}: <Curr input={value}/>
        </div>
    );
}

type Props = {
    budgetAmount: number;
    budgetLeft: number;
    dailyExpenses: DailyExpense[];
    todayDay: number;
    daysInMonth: number;
    budgetUrl: string;
};

export function BudgetWidget({budgetAmount, budgetLeft, dailyExpenses, todayDay, daysInMonth, budgetUrl}: Props) {
    const isOverBudget = budgetAmount > 0 && budgetLeft < 0;
    const sparklineData = budgetAmount > 0
        ? buildSparklineData(dailyExpenses, budgetAmount, todayDay, daysInMonth)
        : [];

    return (
        <Card className={`sm:col-span-2 lg:col-span-1 ${isOverBudget ? 'border-destructive' : ''}`}>
            <CardHeader>
                <CardDescription>
                    <Link to={budgetUrl} className="hover:underline">Pozostały Budżet</Link>
                </CardDescription>
                {budgetAmount === 0 ? (
                    <CardTitle className="text-base text-muted-foreground">
                        Brak budżetu —{' '}
                        <Link to={budgetUrl} className="underline hover:text-foreground">ustaw budżet</Link>
                    </CardTitle>
                ) : (
                    <>
                        <CardTitle className="text-2xl">
                            <Curr input={budgetLeft} colored/>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            z <Curr input={budgetAmount}/>
                        </p>
                    </>
                )}
            </CardHeader>
            {budgetAmount > 0 && sparklineData.length > 0 && (
                <CardContent className="pt-0 pb-2">
                    <ResponsiveContainer width="100%" height={80}>
                        <ComposedChart data={sparklineData} margin={{top: 4, right: 0, left: 0, bottom: 4}}>
                            <Tooltip content={<CustomTooltip/>} cursor={{stroke: '#aaa', strokeWidth: 1}}/>
                            <ReferenceLine y={0} stroke="#dddddd" strokeWidth={1}/>
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke={isOverBudget ? "#e07060" : "#5e9abf"}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="projected"
                                stroke="#aaaaaa"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            )}
        </Card>
    );
}
