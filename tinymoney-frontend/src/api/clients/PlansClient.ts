import type {
    AddPlanTagRequest,
    CreatePlanRequest,
    PlanDetail,
    PlanSummary,
    UpdatePlanRequest,
    UpdatePlanTagRequest
} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface PlansClient {
    getPlans(): Promise<PlanSummary[]>;
    getPlan(planId: number): Promise<PlanDetail>;
    createPlan(req: CreatePlanRequest): Promise<PlanSummary>;
    updatePlan(planId: number, req: UpdatePlanRequest): Promise<void>;
    deletePlan(planId: number): Promise<void>;
    addPlanTag(planId: number, req: AddPlanTagRequest): Promise<void>;
    updatePlanTag(planId: number, tagId: number, req: UpdatePlanTagRequest): Promise<void>;
    deletePlanTag(planId: number, tagId: number): Promise<void>;
}

export class PlansClientImpl extends ApiBase implements PlansClient {
    async getPlans(): Promise<PlanSummary[]> {
        const res = await this.request('GET', '/plans');
        if (!res.ok) throw new Error('Błąd pobierania planów');
        return res.json();
    }

    async getPlan(planId: number): Promise<PlanDetail> {
        const res = await this.request('GET', `/plans/${planId}`);
        if (res.status === 404) throw new Error('Nie znaleziono planu.');
        if (!res.ok) throw new Error('Błąd pobierania planu');
        return res.json();
    }

    async createPlan(req: CreatePlanRequest): Promise<PlanSummary> {
        const res = await this.request('POST', '/plans', req);
        if (!res.ok) throw new Error('Błąd tworzenia planu');
        return res.json();
    }

    async updatePlan(planId: number, req: UpdatePlanRequest): Promise<void> {
        const res = await this.request('PUT', `/plans/${planId}`, req);
        if (!res.ok) throw new Error('Błąd aktualizacji planu');
    }

    async deletePlan(planId: number): Promise<void> {
        const res = await this.request('DELETE', `/plans/${planId}`);
        if (!res.ok) throw new Error('Błąd usuwania planu');
    }

    async addPlanTag(planId: number, req: AddPlanTagRequest): Promise<void> {
        const res = await this.request('POST', `/plans/${planId}/tags`, req);
        if (!res.ok) {
            const msg = res.status === 409 ? await res.text() : 'Błąd dodawania pozycji';
            throw new Error(msg);
        }
    }

    async updatePlanTag(planId: number, tagId: number, req: UpdatePlanTagRequest): Promise<void> {
        const res = await this.request('PUT', `/plans/${planId}/tags/${tagId}`, req);
        if (!res.ok) throw new Error('Błąd aktualizacji pozycji');
    }

    async deletePlanTag(planId: number, tagId: number): Promise<void> {
        const res = await this.request('DELETE', `/plans/${planId}/tags/${tagId}`);
        if (!res.ok) throw new Error('Błąd usuwania pozycji');
    }
}
