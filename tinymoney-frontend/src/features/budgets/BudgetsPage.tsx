import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {BudgetTable} from "@/features/budgets/BudgetTable.tsx";
import {Link, useSearchParams} from "react-router-dom";
import {endOfMonth, format, parse, startOfMonth} from "date-fns";
import {CopyBudgetDialog} from "@/features/budgets/CopyBudgetDialog.tsx";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ButtonGroup, ButtonGroupSeparator} from "@/components/ui/button-group.tsx";
import {getTransactionsUrl, monthYearNameFormat, prepareTitleText} from "@/lib/utils.ts";
import {pl} from "date-fns/locale/pl";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

export function BudgetsPage() {
    const apiClient = useApiClient();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const handlePeriodChange = (newPeriod: MonthSelection) => {
        setSearchParams({ budgetPeriod: `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}` });
    };
    
    const budgetPeriod = useMemo(() => {
        const periodStr = searchParams.get("budgetPeriod");
        const date = periodStr ? parse(periodStr, "yyyy-MM", new Date()) : new Date();
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }, [searchParams]);
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);

    useEffect(() => {
        if (!searchParams.get("budgetPeriod")) {
            handlePeriodChange(budgetPeriod);
        }
    }, [budgetPeriod]);

    const budgetQuery = useQuery({
        queryKey: ['budget', budgetPeriod],
        queryFn: () => apiClient.getBudget(budgetPeriod)
    })

    const budgetSuggestionsQuery = useQuery({
        queryKey: ['budgetSuggestions', budgetPeriod],
        queryFn: () => apiClient.getBudgetSuggestions(budgetPeriod)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Budżet - ${format(budgetPeriodReferenceDate, monthYearNameFormat, { locale: pl })}`)}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Budżet</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:justify-between sm:items-center">
                <MonthPicker month={budgetPeriod} onChange={handlePeriodChange}/>
                <ButtonGroup>
                    <CopyBudgetDialog currentMonth={budgetPeriod} />
                    <ButtonGroupSeparator />
                    <Button asChild>
                        <Link to={getTransactionsUrl({dateFrom: startOfMonth(budgetPeriodReferenceDate), dateTo: endOfMonth(budgetPeriodReferenceDate)})} target={"_blank"}>
                            Zobacz transakcje
                        </Link>
                    </Button>                    
                </ButtonGroup>
            </div>

            {(budgetQuery.isLoading || budgetSuggestionsQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(budgetQuery.isError || budgetSuggestionsQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {budgetQuery.data && budgetSuggestionsQuery.data &&
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                        <Card>
                            <CardHeader>
                                <CardDescription>Miesięczny budżet</CardDescription>
                                <CardTitle className="text-2xl">
                                    <Curr input={budgetQuery.data.monthlyBudget.amount} />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>Rzeczywiste wydatki</CardDescription>
                                <CardTitle className="text-2xl">
                                    <Curr input={budgetQuery.data.monthlyBudget.usedAmount} />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>Różnica</CardDescription>
                                <CardTitle className="text-2xl">
                                    <Curr input={budgetQuery.data.monthlyBudget.amountLeft} colored />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                    
                    <BudgetTable budget={budgetQuery.data} budgetPeriod={budgetPeriod} budgetSuggestions={budgetSuggestionsQuery.data.subcategoryBudgetSuggestions} />
                </>
            }
        </div>
    )
}