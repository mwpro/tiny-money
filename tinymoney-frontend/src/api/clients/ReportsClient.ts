import type {DashboardResponse, SankeyReport, SavingsReport, SummaryReport, TopListReport} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import type {MonthSelection} from "@/components/MonthPicker.tsx";

export interface ReportsClient {
    getSummaryReport(dateFrom: Date | undefined, dateTo: Date | undefined, splitByMonth: boolean): Promise<SummaryReport>;
    getTopListReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<TopListReport>;
    getSankeyReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<SankeyReport>;
    getDashboardReport(month: MonthSelection): Promise<DashboardResponse>;
    getSavingsReport(): Promise<SavingsReport>;
}

export class ReportsClientImpl extends ApiBase implements ReportsClient {
    async getSummaryReport(dateFrom: Date | undefined, dateTo: Date | undefined, splitByMonth: boolean): Promise<SummaryReport> {
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
        queryParams.append('splitByMonth', splitByMonth ? "true" : "false");
        const res = await this.request('GET', `/reports/summary-report?${queryParams}`);
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }

    async getTopListReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<TopListReport> {
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
        queryParams.append('numberOfTopEntries', "15");
        const res = await this.request('GET', `/reports/top-list-report?${queryParams}`);
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }

    async getSankeyReport(dateFrom: Date | undefined, dateTo: Date | undefined): Promise<SankeyReport> {
        const queryParams = new URLSearchParams();
        dateFrom && queryParams.append('dateFrom', format(dateFrom, dateFormat));
        dateTo && queryParams.append('dateTo', format(dateTo, dateFormat));
        const res = await this.request('GET', `/reports/sankey-report?${queryParams}`);
        if (!res.ok) throw new Error('Błąd pobierania raportu');
        return res.json();
    }
    
    async getDashboardReport(month: MonthSelection): Promise<DashboardResponse> {
        const res = await this.request('GET', `/reports/dashboard/${month.year}/${month.month}`);
        if (!res.ok) throw new Error('Błąd pobierania danych dashboardu');
        return res.json();
    }

    async getSavingsReport(): Promise<SavingsReport> {
        const res = await this.request('GET', '/reports/savings-report');
        if (!res.ok) throw new Error('Błąd pobierania raportów oszczędności');
        return res.json();
    }
}
