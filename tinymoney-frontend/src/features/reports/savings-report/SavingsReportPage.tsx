import {useQuery} from "@tanstack/react-query";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {ByCategoryChart} from "@/features/reports/savings-report/ByCategoryChart.tsx";
import {CashFlowsChart} from "@/features/reports/savings-report/CashFlowsChart.tsx";
import {SavingsReportTable} from "@/features/reports/savings-report/SavingsReportTable.tsx";

export function SavingsReportPage() {
    const {savingsClient} = useApiClient();
    const {data, isLoading} = useQuery({
        queryKey: ["savings-report"],
        queryFn: () => savingsClient.getReport(),
    });

    if (isLoading || !data) return null;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ByCategoryChart data={data.byCategory}/>
                <CashFlowsChart data={data.cashFlows}/>
            </div>
            <SavingsReportTable tableData={data.tableData}/>
        </>
    );
}
