import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getBudget, getBudgetSuggestions, getCategories} from "@/lib/api.ts";
import {BudgetTable} from "@/features/budgets/BudgetTable.tsx";
import {Link, useSearchParams} from "react-router-dom";
import {endOfMonth, format, parse, startOfMonth} from "date-fns";
import {CopyBudgetDialog} from "@/features/budgets/CopyBudgetDialog.tsx";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ButtonGroup, ButtonGroupSeparator} from "@/components/ui/button-group.tsx";
import {CategoriesReportTable} from "@/features/reports/CategoriesReportTable.tsx";
import {SummaryReportTable} from "@/features/reports/SummaryReportTable.tsx";


const months = [
    "01-2025", "02-2025", "03-2025", "04-2025", "05-2025", "06-2025",
    "07-2025", "08-2025", "09-2025", "10-2025", "11-2025", "12-2025",
]

const years = [
    "2015", "2016", "2017", "2018", "2019", "2019", "2020",
    "2021", "2022", "2023", "2024", "2025", "2026"
]


export function ReportsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

    const handlePeriodChange = (newPeriod: MonthSelection) => {
        setSearchParams({ budgetPeriod: `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}` });
    };

    const [reportPeriods, setReportPeriods] = useState(months);

    const budgetPeriod = useMemo(() => {
        const periodStr = searchParams.get("budgetPeriod");
        const date = periodStr ? parse(periodStr, "yyyy-MM", new Date()) : new Date();
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }, [searchParams]);
    const budgetPeriodReferenceDate = new Date(budgetPeriod.year, budgetPeriod.month - 1, 1);
    const transactionsListPath = `/transactions?dateFrom=${format(startOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(budgetPeriodReferenceDate), "yyyy-MM-dd")}`


    useEffect(() => {
        if (!searchParams.get("budgetPeriod")) {
            handlePeriodChange(budgetPeriod);
        }
    }, [budgetPeriod]);

    const budgetQuery = useQuery({
        queryKey: ['budget', budgetPeriod],
        queryFn: () => getBudget(auth, budgetPeriod)
    })

    const budgetSuggestionsQuery = useQuery({
        queryKey: ['budgetSuggestions', budgetPeriod],
        queryFn: () => getBudgetSuggestions(auth, budgetPeriod)
    })

    const categoriesQuery = useQuery({
        queryKey: ['categories', budgetPeriod],
        queryFn: () => getCategories(auth)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Raport roczny</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6 justify-between">
                <MonthPicker month={budgetPeriod} onChange={handlePeriodChange}/>
                <ButtonGroup>
                    <CopyBudgetDialog currentMonth={budgetPeriod} />
                    <ButtonGroupSeparator />
                    <Button asChild>
                        <Link to={transactionsListPath} target={"_blank"}>
                            Zobacz transakcje
                        </Link>
                    </Button>
                    <ButtonGroupSeparator />
                    <Button onClick={() => setReportPeriods(prevState => prevState == years ? months : years)}>
                        Przełącz na {reportPeriods == years ? "miesiące" : "lata"}
                    </Button>
                </ButtonGroup>
            </div>

            {(budgetQuery.isLoading || categoriesQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(budgetQuery.isError || categoriesQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {budgetQuery.data && categoriesQuery.data &&
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
                    <h2 className="text-xl font-bold">Podsumowanie</h2>
                    <div>
                        <ul>
                            <li>Miesiące: Wykres: liniowy: x: miesiąc, y: przychody, wydatki, budżet, bilans
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                            <li>Lata: Wykres: liniowy: x: rok, y: przychody, wydatki, bilans
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <SummaryReportTable budgetPeriod={budgetPeriod} reportPeriods={reportPeriods} />
                    <h2 className="text-xl font-bold">Przychody</h2>
                    <div>
                        <ul>
                            <li>Wykres kołowy: per kategoria, po kliknięciu pokazuje podkategorie?</li>
                            <li>Wykres: słupkowy: x: miesiąc lub rok, y: słupki kategorii w danym miesiącu;
                                Rozbicia na podkategorie?
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <CategoriesReportTable categories={categoriesQuery.data.filter(c => c.isIncome)} budgetPeriod={budgetPeriod} reportPeriods={reportPeriods} />
                    <h2 className="text-xl font-bold">Wydatki</h2>
                    <div>
                        <ul>
                            <li>Wykres kołowy: per kategoria, po kliknięciu pokazuje podkategorie?</li>
                            <li>Wykres: słupkowy: x: miesiąc lub rok, y: słupki kategorii w danym miesiącu; 
                                Rozbicia na podkategorie?
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <CategoriesReportTable categories={categoriesQuery.data.filter(c => !c.isIncome)} budgetPeriod={budgetPeriod} reportPeriods={reportPeriods} />
                </>
            }
        </div>
    )
}