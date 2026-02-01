import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getCategoriesReport} from "@/lib/api.ts";
import {useSearchParams} from "react-router-dom";
import {parse} from "date-fns";
import {CategoriesReportTable} from "@/features/reports/CategoriesReportTable.tsx";
import {SummaryReportTable} from "@/features/reports/SummaryReportTable.tsx";

export function ReportsPage() {
    const auth = useAuth0();
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

    useEffect(() => {
        if (!searchParams.get("budgetPeriod")) {
            handlePeriodChange(budgetPeriod);
        }
    }, [budgetPeriod]);

    const reportQuery = useQuery({
        queryKey: ['categoriesReport', budgetPeriod],
        queryFn: () => getCategoriesReport(auth)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Raport roczny</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6 justify-between">
                <MonthPicker month={budgetPeriod} onChange={handlePeriodChange}/>
            </div>

            {(reportQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(reportQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {reportQuery.data &&
                <>
                    <h2 className="text-xl font-bold">Podsumowanie</h2>
                    <div>
                        <ul>
                            <li>Miesiące: Wykres: liniowy: x: miesiąc, y: przychody, wydatki, budżet, bilans
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                            <li>Lata: Wykres: liniowy: x: rok, y: przychody, wydatki, bilans
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <SummaryReportTable reportData={reportQuery.data} />
                    <h2 className="text-xl font-bold">Przychody</h2>
                    <div>
                        <ul>
                            <li>Wykres kołowy: per kategoria, po kliknięciu pokazuje podkategorie?</li>
                            <li>Wykres: słupkowy: x: miesiąc lub rok, y: słupki kategorii w danym miesiącu;
                                Rozbicia na podkategorie?
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <CategoriesReportTable categories={reportQuery.data.categories.filter(c => c.isIncome)} budgetPeriod={budgetPeriod} />
                    <h2 className="text-xl font-bold">Wydatki</h2>
                    <div>
                        <ul>
                            <li>Wykres kołowy: per kategoria, po kliknięciu pokazuje podkategorie?</li>
                            <li>Wykres: słupkowy: x: miesiąc lub rok, y: słupki kategorii w danym miesiącu; 
                                Rozbicia na podkategorie?
                                Czy na wykresie da się/chcemy pokazać zmiany r/r?</li>
                        </ul>
                    </div>
                    <CategoriesReportTable categories={reportQuery.data.categories.filter(c => !c.isIncome)} budgetPeriod={budgetPeriod} />
                </>
            }
        </div>
    )
}