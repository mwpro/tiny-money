import {useAuth0} from "@auth0/auth0-react";
import {Fragment, useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getSankeyReport, type SankeyChart} from "@/lib/api.ts";
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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined
}

export function SankeyReportPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sankeyChartData, setSankeyChartData] = useState<SankeyChart[]>([]);

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
        queryFn: () => getSankeyReport(auth, reportSettings.dateFrom, reportSettings.dateTo),
    })
    useEffect(() => {
        if (reportQuery.data) {
            setSankeyChartData([reportQuery.data.root]);
        }
    }, [reportQuery.data]);

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
            {reportQuery.data?.root.links && sankeyChartData &&
                <>
                    <Breadcrumb>
                        <BreadcrumbList>
                            {sankeyChartData.map((chart, i) =>
                                (
                                    <Fragment key={i}>
                                        {i == sankeyChartData.length - 1 ?
                                            <BreadcrumbItem  className={"text-lg"}>
                                                <BreadcrumbPage>{chart.nodes[0].name}</BreadcrumbPage>
                                            </BreadcrumbItem>
                                            :
                                            <>
                                                <BreadcrumbItem className={"text-lg"}>
                                                    <BreadcrumbLink onClick={() =>
                                                        setSankeyChartData(v => {
                                                            for (let j = i; j < sankeyChartData.length; j++) {
                                                                v.pop();
                                                            }
                                                            return [...v];
                                                        })}>{chart.nodes[0].name}</BreadcrumbLink>
                                                </BreadcrumbItem>
                                                <BreadcrumbSeparator/>
                                            </>}
                                    </Fragment>
                                ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <ResponsiveContainer height={600}
                    >
                        <Sankey
                            data={sankeyChartData[sankeyChartData.length - 1]}
                            sort
                            onClick={e => {
                                console.log(e);
                                // @ts-ignore
                                if (e.payload?.subChart) {
                                    // @ts-ignore
                                    setSankeyChartData(v => {
                                        // @ts-ignore
                                        v.push(e.payload.subChart);
                                        return [...v];
                                    });
                                    // @ts-ignore
                                } else if (e.payload?.index === 0 && sankeyChartData.length > 1) {
                                    setSankeyChartData(v => {
                                        v.pop();
                                        return [...v];
                                    });
                                }
                                // whatever we clicked node or link, display subchart or go to upper level
                            }}
                        >
                            <Tooltip formatter={(v) => (typeof v === "number") ? formatCurrencyAsString(v) : v } />
                        </Sankey>
                    </ResponsiveContainer>
                </>
            }
        </div>
    )
}