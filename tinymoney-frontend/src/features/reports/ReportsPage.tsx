import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getCategoriesReport} from "@/lib/api.ts";
import {useSearchParams} from "react-router-dom";
import {differenceInCalendarMonths, endOfYear, format, parse, startOfYear} from "date-fns";
import {CategoriesReportTable} from "@/features/reports/CategoriesReportTable.tsx";
import {SummaryReportTable} from "@/features/reports/SummaryReportTable.tsx";
import {SummaryLineChart} from "@/features/reports/SummaryLineChart.tsx";
import {DatePicker} from "@/components/DatePicker.tsx";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group.tsx";
import {CategoryBreakdownPieChart} from "@/features/reports/CategoryBreakdownPieChart.tsx";
import {CategoryBreakdownBarChart} from "@/features/reports/CategoryBreakdownBarChart.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    splitByMonth: boolean
}

export function ReportsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

    const handlePeriodChange = (dateFrom: Date | undefined, dateTo: Date | undefined) => {
        if (!dateFrom || !dateTo) {
            return;
        }
        const splitByMonth = differenceInCalendarMonths(dateTo, dateFrom) <= 24;
        setSearchParams({ dateFrom: format(dateFrom, "yyyy-MM-dd"), dateTo: format(dateTo, "yyyy-MM-dd"), splitByMonth: splitByMonth ? "true" : "false"});
    };
    const handleSplitByMonthChange = (splitByMonth: boolean) => {
        setSearchParams((params) => { 
            params.set("splitByMonth", splitByMonth ? "true" : "false");
            return params;
        });
    };

    const reportSettings = useMemo<ReportSettings>(() => {
        const dateFrom = searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, "yyyy-MM-dd", new Date()) : startOfYear(new Date());
        const dateTo = searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, "yyyy-MM-dd", new Date()) : endOfYear(new Date());
        const splitByMonth = searchParams.get("splitByMonth") ? (searchParams.get("splitByMonth") === "true") : (differenceInCalendarMonths(dateTo, dateFrom) <= 24);
        return {
            dateFrom, dateTo, splitByMonth
        };
    }, [searchParams]);

    useEffect(() => {
        if (!searchParams.size) {
            handlePeriodChange(startOfYear(new Date()), endOfYear(new Date()))
        }
    }, [reportSettings]);

    const reportQuery = useQuery({
        queryKey: ['categoriesReport', reportSettings],
        queryFn: () => getCategoriesReport(auth, reportSettings.dateFrom, reportSettings.dateTo, reportSettings.splitByMonth)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Raport roczny</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <DatePicker dateFrom={reportSettings.dateFrom} dateTo={reportSettings.dateTo} 
                            onChange={handlePeriodChange}/>
                <ToggleGroup variant="outline" className={"bg-background"}
                             type="single" defaultValue="month"
                             value={reportSettings.splitByMonth ? "month" : "year"}
                             onValueChange={str => handleSplitByMonthChange(str === "month")}>
                    <ToggleGroupItem value="month">Miesiąc</ToggleGroupItem>
                    <ToggleGroupItem value="year">Rok</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {(reportQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(reportQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {reportQuery.data &&
                <>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Podsumowanie</h2>
                        <SummaryLineChart reportPeriods={reportQuery.data.periods} splitByMonth={reportSettings.splitByMonth} />
                        <SummaryReportTable reportData={reportQuery.data} splitByMonth={reportSettings.splitByMonth} />
                    </div>
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Przychody</h2>
                        <div className={"flex flex-row gap-4 mb-3"}>
                            <CategoryBreakdownPieChart categories={reportQuery.data.categories.filter(c => c.isIncome)} />
                            <CategoryBreakdownBarChart categories={reportQuery.data.categories.filter(c => c.isIncome)} />
                        </div>
                        <CategoriesReportTable categories={reportQuery.data.categories.filter(c => c.isIncome)} reportSettings={reportSettings} />
                    </div>
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Wydatki</h2>
                        <div className={"flex flex-row gap-4 mb-3"}>
                            <CategoryBreakdownPieChart categories={reportQuery.data.categories.filter(c => !c.isIncome)} />
                            <CategoryBreakdownBarChart categories={reportQuery.data.categories.filter(c => !c.isIncome)} />                        
                        </div>
                        <CategoriesReportTable categories={reportQuery.data.categories.filter(c => !c.isIncome)} reportSettings={reportSettings} />
                    </div>
                </>
            }
        </div>
    )
}