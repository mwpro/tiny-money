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
import {ResponsiveContainer, Sankey} from "recharts";
import {formatCurrencyAsString} from "@/components/Curr.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import {SeriesColorPalette} from "@/features/reports/summary-report/CategoryBreakdownBarChart.tsx";

export interface ReportSettings {
    dateFrom: Date | undefined,
    dateTo: Date | undefined
}

type CustomNodePayload = {
    name: string;
    sourceNodes: number[];
    sourceLinks: number[];
    targetLinks: number[];
    targetNodes: number[];
    value: number;
    depth: number;
    x: number;
    dx: number;
    y: number;
    dy: number;
};
type CustomLinkPayload = {
    source: CustomNodePayload;
    target: CustomNodePayload;
    value: number;
    dy: number;
    sy: number;
    ty: number;
    isExpense: boolean;
};
const CustomLink = (props: {
    sourceX: number;
    targetX: number;
    sourceY: number;
    targetY: number;
    sourceControlX: number;
    targetControlX: number;
    sourceRelativeY: number;
    targetRelativeY: number;
    linkWidth: number;
    index: number;
    payload: CustomLinkPayload;
}) => {
    return (
        <g>
            <path
                d={`
  M${props.sourceX},${props.sourceY}
  C${props.sourceControlX},${props.sourceY} ${props.targetControlX},${props.targetY} ${props.targetX},${props.targetY}`}
                fill="none"
                stroke={SeriesColorPalette[props.payload.source.depth % SeriesColorPalette.length]}
                strokeOpacity={0.4}
                strokeWidth={props.linkWidth}
                strokeLinecap="butt"
            />
            <foreignObject
                x={props.sourceX}
                y={props.targetY - props.linkWidth / 2}
                width={
                    Math.max(props.targetX, props.sourceX) -
                    Math.min(props.targetX, props.sourceX)
                }
                height={props.linkWidth}
                style={{
                    overflow: 'visible',
                }}
            >
                <div
                    style={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: props.payload.isExpense ? 'flex-end' : 'flex-start',
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                        padding: '0.5em',
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontFamily: 'sans-serif',
                            textAlign: 'center',
                            backgroundColor: '#f1f5fe80',
                            padding: '0.25em 0.5em',
                            borderRadius: 4,
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {props.payload.isExpense ? `${props.payload.target.name}: ` : `${props.payload.source.name}: `}
                        {formatCurrencyAsString(props.payload.value)}
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

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
        queryKey: ['sankeyReport', reportSettings],
        queryFn: () => getSankeyReport(auth, reportSettings.dateFrom, reportSettings.dateTo),
    })
    useEffect(() => {
        if (reportQuery.data?.root) {
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
            {sankeyChartData.length > 0 &&
                <>
                    <Breadcrumb>
                        <BreadcrumbList>
                            {sankeyChartData.map((chart, i) => {
                                return (
                                    <Fragment key={i}>
                                        {i == sankeyChartData.length - 1 ?
                                            <BreadcrumbItem className={"text-lg"}>
                                                <BreadcrumbPage>{chart.nodes[0].name}</BreadcrumbPage>
                                            </BreadcrumbItem>
                                            :
                                            <>
                                                <BreadcrumbItem className={"text-lg"}>
                                                    <BreadcrumbLink onClick={() => setSankeyChartData(v => v.slice(0, i + 1))}>{chart.nodes[0].name}</BreadcrumbLink>
                                                </BreadcrumbItem>
                                                <BreadcrumbSeparator/>
                                            </>}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <ResponsiveContainer height={800}>
                        <Sankey
                            data={sankeyChartData[sankeyChartData.length - 1]}
                            sort
                            link={CustomLink}
                            onClick={(e: { payload: { subChart: SankeyChart; index: number; }; }) => {
                                if (e.payload?.subChart) {
                                    setSankeyChartData(v => {
                                        v.push(e.payload.subChart);
                                        return [...v];
                                    });
                                } else if (e.payload?.index === 0 && sankeyChartData.length > 1) {
                                    setSankeyChartData(v => {
                                        v.pop();
                                        return [...v];
                                    });
                                }
                            }}
                        />
                    </ResponsiveContainer>
                </>
            }
        </div>
    )
}