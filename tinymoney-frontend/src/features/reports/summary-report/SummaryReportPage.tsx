import {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useSearchParams} from "react-router-dom";
import {
    differenceInCalendarMonths,
    endOfMonth,
    format,
    parse,
    startOfMonth,
    subMonths
} from "date-fns";
import {CategoriesTable} from "@/features/reports/summary-report/CategoriesTable.tsx";
import {SummaryReportTable} from "@/features/reports/summary-report/SummaryReportTable.tsx";
import {SummaryLineChart} from "@/features/reports/summary-report/SummaryLineChart.tsx";
import {DateRangePicker, reportPresets} from "@/components/DateRangePicker.tsx";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group.tsx";
import {CategoryBreakdownPieChart} from "@/features/reports/summary-report/CategoryBreakdownPieChart.tsx";
import {CategoryBreakdownBarChart} from "@/features/reports/summary-report/CategoryBreakdownBarChart.tsx";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {dateFormat, prepareTitleText} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    splitByMonth: boolean
}

export function SummaryReportPage() {
    const { reportsClient } = useApiClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [dateRangeDescription, setDateRangeDescription] = useState<string>("");

    const handlePeriodChange = (dateFrom: Date | undefined, dateTo: Date | undefined) => {
        if (!dateFrom || !dateTo) {
            return;
        }
        const splitByMonth = differenceInCalendarMonths(dateTo, dateFrom) <= 24;
        setSearchParams({ dateFrom: format(dateFrom, dateFormat), dateTo: format(dateTo, dateFormat), splitByMonth: splitByMonth ? "true" : "false"});
    };
    const handleSplitByMonthChange = (splitByMonth: boolean) => {
        setSearchParams((params) => { 
            params.set("splitByMonth", splitByMonth ? "true" : "false");
            return params;
        });
    };

    const reportSettings = useMemo<ReportSettings>(() => {
        const dateFrom = searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, dateFormat, new Date()) : startOfMonth(subMonths(new Date(), 12));
        const dateTo = searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, dateFormat, new Date()) : endOfMonth(new Date());
        const splitByMonth = searchParams.get("splitByMonth") ? (searchParams.get("splitByMonth") === "true") : (differenceInCalendarMonths(dateTo, dateFrom) <= 24);
        return {
            dateFrom, dateTo, splitByMonth
        };
    }, [searchParams]);

    useEffect(() => {
        if (!searchParams.size) {
            handlePeriodChange(startOfMonth(subMonths(new Date(), 12)), endOfMonth(new Date()))
        }
    }, [reportSettings]);

    const reportQuery = useQuery({
        queryKey: ['summaryReport', reportSettings],
        queryFn: () => reportsClient.getSummaryReport(reportSettings.dateFrom, reportSettings.dateTo, reportSettings.splitByMonth)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Podsumowanie - ${dateRangeDescription}`)}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-serif">Raport - podsumowanie</h1>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <DateRangePicker dateFrom={reportSettings.dateFrom} dateTo={reportSettings.dateTo}
                                 onChange={handlePeriodChange} onRangeDescriptionChange={setDateRangeDescription}
                                 presets={reportPresets} monthYearMode={true} />
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
                <div className="p-10 text-destructive">Błąd ładowania danych</div>}
            {reportQuery.data && reportQuery.data.periods.length == 0 &&
                <Alert className="mb-6" variant="default">
                    <AlertTitle>Nie znaleziono transakcji w wybranym przedziale czasowym.</AlertTitle>
                </Alert>}
            {reportQuery.data && reportQuery.data.periods.length > 0 &&
                <>
                    <div className="mb-6">
                        <SummaryLineChart reportPeriods={reportQuery.data.periods} splitByMonth={reportSettings.splitByMonth} />
                        <SummaryReportTable reportData={reportQuery.data} splitByMonth={reportSettings.splitByMonth} />
                    </div>
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Przychody</h2>
                        <div className="flex flex-col md:flex-row gap-4 mb-3">
                            <CategoryBreakdownPieChart categories={reportQuery.data.categories.filter(c => c.isIncome)} />
                            <CategoryBreakdownBarChart categories={reportQuery.data.categories.filter(c => c.isIncome)} />
                        </div>
                        <CategoriesTable categories={reportQuery.data.categories.filter(c => c.isIncome)} reportSettings={reportSettings} />
                    </div>
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Wydatki</h2>
                        <div className="flex flex-col md:flex-row gap-4 mb-3">
                            <CategoryBreakdownPieChart categories={reportQuery.data.categories.filter(c => !c.isIncome)} />
                            <CategoryBreakdownBarChart categories={reportQuery.data.categories.filter(c => !c.isIncome)} />                        
                        </div>
                        <CategoriesTable categories={reportQuery.data.categories.filter(c => !c.isIncome)} reportSettings={reportSettings} />
                    </div>
                </>
            }
        </div>
    )
}