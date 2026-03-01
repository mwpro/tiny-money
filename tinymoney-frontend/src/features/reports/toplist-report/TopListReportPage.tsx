import {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useSearchParams} from "react-router-dom";
import {
    endOfMonth,
    format,
    parse,
    startOfMonth,
    subMonths
} from "date-fns";
import {DateRangePicker, reportPresets} from "@/components/DateRangePicker.tsx";
import {TopTransactionsTable} from "@/features/reports/toplist-report/TopTransactionsTable.tsx";
import {TopEntriesTable} from "@/features/reports/toplist-report/TopEntriesTable.tsx";
import {dateFormat, prepareTitleText} from "@/lib/utils.ts";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined
}

export function TopListReportPage() {
    const apiClient = useApiClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [dateRangeDescription, setDateRangeDescription] = useState<string>("")

    const handlePeriodChange = (dateFrom: Date | undefined, dateTo: Date | undefined) => {
        if (!dateFrom || !dateTo) {
            return;
        }
        setSearchParams({ dateFrom: format(dateFrom, dateFormat), dateTo: format(dateTo, dateFormat)});
    };
    
    const reportSettings = useMemo<ReportSettings>(() => {
        const dateFrom = searchParams.get("dateFrom") ? parse(searchParams.get("dateFrom") as string, dateFormat, new Date()) : startOfMonth(subMonths(new Date(), 12));
        const dateTo = searchParams.get("dateTo") ? parse(searchParams.get("dateTo") as string, dateFormat, new Date()) : endOfMonth(new Date());
        return {
            dateFrom, dateTo
        };
    }, [searchParams]);

    useEffect(() => {
        if (!searchParams.size) {
            handlePeriodChange(startOfMonth(subMonths(new Date(), 12)), endOfMonth(new Date()))
        }
    }, [reportSettings]);

    const reportQuery = useQuery({
        queryKey: ['summaryReport', reportSettings],
        queryFn: () => apiClient.getTopListReport(reportSettings.dateFrom, reportSettings.dateTo)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Toplista - ${dateRangeDescription}`)}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Raport - Top lista</h1>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <DateRangePicker dateFrom={reportSettings.dateFrom} dateTo={reportSettings.dateTo}
                                 onChange={handlePeriodChange} onRangeDescriptionChange={setDateRangeDescription}
                                 presets={reportPresets} monthYearMode={true} />
            </div>

            {(reportQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(reportQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {reportQuery.data &&
                <>
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-3">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-3">Wydatki</h2>
                                <TopTransactionsTable transactions={reportQuery.data.expenses} incomes={false} />                                
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-3">Przychody</h2>
                                <TopTransactionsTable transactions={reportQuery.data.incomes} incomes />                        
                            </div>
                        </div>
                    </div>
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-3">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-3">Sprzedawcy</h2>
                                <TopEntriesTable entries={reportQuery.data.expenseVendors} incomes={false} reportSettings={reportSettings} transactionsUrlConfigurer={t => ({vendorId: t.id})} />                                
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-3">Źródła przychodów</h2>
                                <TopEntriesTable entries={reportQuery.data.incomeVendors} incomes reportSettings={reportSettings} transactionsUrlConfigurer={t => ({vendorId: t.id})} />                        
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-3">Tagi</h2>
                                <TopEntriesTable entries={reportQuery.data.tags} incomes={false} reportSettings={reportSettings} transactionsUrlConfigurer={t => ({tagId: t.id})} />                        
                            </div>
                        </div>
                    </div>
                </>
            }
        </div>
    )
}