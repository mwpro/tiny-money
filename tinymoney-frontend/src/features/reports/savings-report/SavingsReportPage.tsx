import {useQuery} from "@tanstack/react-query";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {ByCategoryChart} from "@/features/reports/savings-report/ByCategoryChart.tsx";
import {CashFlowsChart} from "@/features/reports/savings-report/CashFlowsChart.tsx";
import {SavingsReportTable} from "@/features/reports/savings-report/SavingsReportTable.tsx";
import {prepareTitleText} from "@/lib/utils.ts";

export function SavingsReportPage() {
    const {reportsClient} = useApiClient();
    const reportQuery = useQuery({
        queryKey: ["savings-report"],
        queryFn: () => reportsClient.getSavingsReport(),
    });

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText(`Oszczędności`)}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-serif">Raport - oszczędności</h1>
            </div>
    
            {(reportQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(reportQuery.isError) &&
                <div className="p-10 text-destructive">Błąd ładowania danych</div>}
            {reportQuery.data &&
                <>
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        <ByCategoryChart data={reportQuery.data.byCategory}/>
                        <CashFlowsChart data={reportQuery.data.cashFlows}/>
                    </div>
    
                    <div className="mb-6">
                        <SavingsReportTable tableData={reportQuery.data.tableData}/>
                    </div>
                </>
            }
        </div>
    );
}
