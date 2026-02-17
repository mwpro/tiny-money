import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getSankeyReport} from "@/lib/api.ts";
import {useSearchParams} from "react-router-dom";
import {
    endOfMonth,
    format,
    parse,
    startOfMonth,
    subMonths
} from "date-fns";
import {DateRangePicker, reportPresets} from "@/components/DateRangePicker.tsx";
import {dateFormat} from "@/lib/utils.ts";
import {ResponsiveContainer, Sankey, Tooltip} from "recharts";
import {formatCurrencyAsString} from "@/components/Curr.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined
}

export function SankeyReportPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

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
        queryFn: () => getSankeyReport(auth, reportSettings.dateFrom, reportSettings.dateTo)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Raport - Sankey chart</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <DateRangePicker dateFrom={reportSettings.dateFrom} dateTo={reportSettings.dateTo}
                                 onChange={handlePeriodChange} presets={reportPresets} monthYearMode={true} />
            </div>

            {(reportQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(reportQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {reportQuery.data?.links &&
                <>
                    <ResponsiveContainer
                        height={400}
                        width="100%"
                    >
                        <Sankey
                            data={{
                                links: reportQuery.data.links,
                                nodes: reportQuery.data.nodes
                            }}
                            sort
                            // onClick={e => console.log(e)}
                        >
                            <Tooltip formatter={(v) => (typeof v === "number") ? formatCurrencyAsString(v) : v } />
                        </Sankey>
                    </ResponsiveContainer>
                </>
            }
        </div>
    )
}