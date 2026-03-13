import type {DashboardResponse} from "@/api/ApiTypes.ts";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {ApiBase} from "@/api/ApiBase.ts";

export interface DashboardClient {
    getDashboard(month: MonthSelection): Promise<DashboardResponse>;
}

export class DashboardClientImpl extends ApiBase implements DashboardClient {
    async getDashboard(month: MonthSelection): Promise<DashboardResponse> {
        const res = await this.request('GET', `/reports/dashboard/${month.year}/${month.month}`);
        if (!res.ok) throw new Error('Błąd pobierania danych dashboardu');
        return res.json();
    }
}
