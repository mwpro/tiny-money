import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useSearchParams} from "react-router-dom";
import {endOfMonth, format, getDaysInMonth, parse, startOfMonth} from "date-fns";
import {getTransactionsUrl, monthYearFormat, monthYearNameFormat, prepareTitleText} from "@/lib/utils.ts";
import {pl} from "date-fns/locale/pl";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {TransactionsEditorDialog} from "@/features/transactions/transactions-editor/TransactionsEditorDialog.tsx";
import {IncomesWidget} from "@/features/dashboard/widgets/IncomesWidget.tsx";
import {ExpensesWidget} from "@/features/dashboard/widgets/ExpensesWidget.tsx";
import {UnverifiedWidget} from "@/features/dashboard/widgets/UnverifiedWidget.tsx";
import {BudgetWidget} from "@/features/dashboard/widgets/BudgetWidget.tsx";
import {BudgetRemainingWidget} from "@/features/dashboard/widgets/BudgetRemainingWidget.tsx";
import {BudgetOverspentWidget} from "@/features/dashboard/widgets/BudgetOverspentWidget.tsx";

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

    const monthStart = startOfMonth(dashboardPeriodReferenceDate);
    const monthEnd = endOfMonth(dashboardPeriodReferenceDate);
    const monthPeriodStr = format(dashboardPeriodReferenceDate, monthYearFormat);

    const unverifiedUrl = getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isVerified: false});
    const budgetUrl = `/budgets?budgetPeriod=${monthPeriodStr}`;

    const topRemaining = [...(dashboardQuery.data?.categoryBudgets ?? [])]
        .filter(c => c.amountLeft > 0)
        .sort((a, b) => b.amountLeft - a.amountLeft)
        .slice(0, 5);

    const topOverspent = [...(dashboardQuery.data?.categoryBudgets ?? [])]
        .filter(c => c.amountLeft < 0)
        .sort((a, b) => a.amountLeft - b.amountLeft)
        .slice(0, 5);

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
                    <IncomesWidget
                        incomesTotal={dashboardQuery.data.incomesTotal}
                        href={getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isExpense: false})}
                    />
                    <ExpensesWidget
                        expensesTotal={dashboardQuery.data.expensesTotal}
                        href={getTransactionsUrl({dateFrom: monthStart, dateTo: monthEnd, isExpense: true})}
                    />
                    <UnverifiedWidget
                        unverifiedCount={dashboardQuery.data.unverifiedCount}
                        href={unverifiedUrl}
                    />
                    <BudgetWidget
                        budgetAmount={dashboardQuery.data.budgetAmount}
                        budgetLeft={dashboardQuery.data.budgetLeft}
                        dailyExpenses={dashboardQuery.data.dailyExpenses}
                        todayDay={todayDay}
                        daysInMonth={daysInMonth}
                        budgetUrl={budgetUrl}
                    />
                    <BudgetRemainingWidget topRemaining={topRemaining}/>
                    <BudgetOverspentWidget topOverspent={topOverspent}/>
                </div>
            )}
        </div>
    );
}
