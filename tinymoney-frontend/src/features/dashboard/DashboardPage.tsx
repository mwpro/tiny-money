import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {Link, useSearchParams} from "react-router-dom";
import {endOfMonth, format, getDaysInMonth, parse, startOfMonth} from "date-fns";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {getTransactionsUrl, monthYearFormat, monthYearNameFormat, prepareTitleText} from "@/lib/utils.ts";
import {pl} from "date-fns/locale/pl";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {ComposedChart, Line, ReferenceLine, ResponsiveContainer} from "recharts";
import type {DailyExpense} from "@/api/ApiTypes.ts";
import {CheckSquare} from "lucide-react";

type SparklinePoint = { day: number; actual: number | null; projected: number | null };

function buildSparklineData(budget: number, dailyExpenses: DailyExpense[], today: number, daysInMonth: number): SparklinePoint[] {
    const map = new Map(dailyExpenses.map(d => [d.day, d.amount]));
    let cumulative = 0;
    const data: SparklinePoint[] = Array.from({length: daysInMonth + 1}, (_, i) => ({day: i, actual: null, projected: null}));

    data[0].actual = budget;
    for (let d = 1; d <= today; d++) {
        cumulative += map.get(d) ?? 0;
        data[d].actual = budget - cumulative;
    }

    const dailyRate = today > 0 ? cumulative / today : 0;
    data[today].projected = data[today].actual;
    for (let d = today + 1; d <= daysInMonth; d++) {
        data[d].projected = budget - cumulative - dailyRate * (d - today);
    }
    return data;
}

export function DashboardPage() {
    const {dashboardClient} = useApiClient();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    const handlePeriodChange = (newPeriod: MonthSelection) => {
        setSearchParams({dashboardPeriod: `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}`});
    };

    const dashboardPeriod = useMemo(() => {
        const periodStr = searchParams.get("dashboardPeriod");
        const date = periodStr ? parse(periodStr, "yyyy-MM", new Date()) : new Date();
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }, [searchParams]);

    const dashboardPeriodReferenceDate = new Date(dashboardPeriod.year, dashboardPeriod.month - 1, 1);

    useEffect(() => {
        if (!searchParams.get("dashboardPeriod")) {
            handlePeriodChange(dashboardPeriod);
        }
    }, [dashboardPeriod]);

    const dashboardQuery = useQuery({
        queryKey: ['dashboard', dashboardPeriod],
        queryFn: () => dashboardClient.getDashboard(dashboardPeriod)
    });

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === dashboardPeriod.year && today.getMonth() + 1 === dashboardPeriod.month;
    const todayDay = isCurrentMonth ? today.getDate() : getDaysInMonth(dashboardPeriodReferenceDate);
    const daysInMonth = getDaysInMonth(dashboardPeriodReferenceDate);

    const sparklineData = useMemo(() => {
        if (!dashboardQuery.data || dashboardQuery.data.budgetAmount === 0) return [];
        return buildSparklineData(dashboardQuery.data.budgetAmount, dashboardQuery.data.dailyExpenses, todayDay, daysInMonth);
    }, [dashboardQuery.data, todayDay, daysInMonth]);

    const monthStart = startOfMonth(dashboardPeriodReferenceDate);
    const monthEnd = endOfMonth(dashboardPeriodReferenceDate);
    const monthPeriodStr = format(dashboardPeriodReferenceDate, monthYearFormat);

    const unverifiedUrl = getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isVerified: false});
    const budgetUrl = `/budgets?budgetPeriod=${monthPeriodStr}`;

    const isOverBudget = dashboardQuery.data && dashboardQuery.data.budgetAmount > 0 && dashboardQuery.data.budgetLeft < 0;

    const topRemaining = [...(dashboardQuery.data?.categoryBudgets ?? [])]
        .filter(c => c.amountLeft > 0)
        .sort((a, b) => b.amountLeft - a.amountLeft)
        .slice(0, 5);

    const topOverspent = [...(dashboardQuery.data?.categoryBudgets ?? [])]
        .filter(c => c.amountLeft < 0)
        .sort((a, b) => a.amountLeft - b.amountLeft)
        .slice(0, 5);

    const isAllVerified = dashboardQuery.data?.unverifiedCount === 0;

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Dashboard - ${format(dashboardPeriodReferenceDate, monthYearNameFormat, {locale: pl})}`)}</title>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <MonthPicker month={dashboardPeriod} onChange={handlePeriodChange}/>
                    <TransactionsEditorDialog onTransactionSaved={() => queryClient.invalidateQueries({queryKey: ['dashboard']})}/>
                </div>
            </div>

            {dashboardQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
            {dashboardQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}
            {dashboardQuery.data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    <Link to={getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isExpense: false})} className="block hover:opacity-80 transition-opacity">
                        <Card className="h-full">
                            <CardHeader>
                                <CardDescription>Przychody</CardDescription>
                                <CardTitle className="text-2xl">
                                    <Curr input={dashboardQuery.data.incomesTotal} colored isPositive={true}/>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                    
                    <Link to={getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isExpense: true})} className="block hover:opacity-80 transition-opacity">
                        <Card className="h-full">
                            <CardHeader>
                                <CardDescription>Wydatki</CardDescription>
                                <CardTitle className="text-2xl">
                                    <Curr input={dashboardQuery.data.expensesTotal} colored isPositive={false}/>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link to={unverifiedUrl} className="block hover:opacity-80 transition-opacity">
                        <Card className={`h-full ${isAllVerified ? 'opacity-40' : 'border-amber-400'}`}>
                            <CardHeader>
                                <CardDescription className="flex items-center gap-1">
                                    <CheckSquare className="h-3.5 w-3.5"/>
                                    Do weryfikacji
                                </CardDescription>
                                <CardTitle className="text-2xl">
                                    {isAllVerified
                                        ? <span className="text-base font-normal">Wszystko zweryfikowane ✓</span>
                                        : <>{dashboardQuery.data.unverifiedCount}<span className="text-base font-normal text-muted-foreground ml-1">transakcji</span></>
                                    }
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Card className={`sm:col-span-2 lg:col-span-1 ${isOverBudget ? 'border-destructive' : ''}`}>
                        <CardHeader>
                            <CardDescription>
                                <Link to={budgetUrl} className="hover:underline">Budżet</Link>
                            </CardDescription>
                            {dashboardQuery.data.budgetAmount === 0 ? (
                                <CardTitle className="text-base text-muted-foreground">
                                    Brak budżetu —{' '}
                                    <Link to={budgetUrl} className="underline hover:text-foreground">ustaw budżet</Link>
                                </CardTitle>
                            ) : (
                                <>
                                    <CardTitle className="text-2xl">
                                        <Curr input={dashboardQuery.data.budgetLeft} colored/>
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        z <Curr input={dashboardQuery.data.budgetAmount}/>
                                    </p>
                                </>
                            )}
                        </CardHeader>
                        {dashboardQuery.data.budgetAmount > 0 && sparklineData.length > 0 && (
                            <CardContent className="pt-0 pb-2">
                                <ResponsiveContainer width="100%" height={80}>
                                    <ComposedChart data={sparklineData} margin={{top: 4, right: 0, left: 0, bottom: 4}}>
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

                    {dashboardQuery.data.budgetAmount > 0 && topRemaining.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardDescription>Największa nadwyżka</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {topRemaining.map(c => (
                                    <div key={c.subcategoryName} className="flex justify-between text-sm py-0.5">
                                        <span>{c.subcategoryName}</span>
                                        <Curr input={c.amountLeft} colored isPositive={true}/>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {dashboardQuery.data.budgetAmount > 0 && topOverspent.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardDescription>Największe przekroczenie</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {topOverspent.map(c => (
                                    <div key={c.subcategoryName} className="flex justify-between text-sm py-0.5">
                                        <span>{c.subcategoryName}</span>
                                        <Curr input={c.amountLeft} colored isPositive={false}/>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
