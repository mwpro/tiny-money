import type {SavingsCategory, SavingsAccount, SavingsSnapshotResponse, SaveSnapshotItem, SavingsCushion, UpdateSavingsCushionRequest, SavingsReport} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface SavingsClient {
    getCategories(): Promise<SavingsCategory[]>;
    createCategory(name: string): Promise<void>;
    updateCategory(id: number, name: string): Promise<void>;
    deleteCategory(id: number): Promise<void>;

    getAccounts(includeArchived?: boolean): Promise<SavingsAccount[]>;
    createAccount(name: string, categoryId: number): Promise<void>;
    updateAccount(id: number, name: string, categoryId: number, isActive: boolean): Promise<void>;

    getSnapshot(year: number, month: number): Promise<SavingsSnapshotResponse>;
    saveSnapshot(year: number, month: number, entries: SaveSnapshotItem[]): Promise<void>;

    getCushion(): Promise<SavingsCushion>;
    updateCushion(request: UpdateSavingsCushionRequest): Promise<void>;

    getReport(): Promise<SavingsReport>;
}

export class SavingsClientImpl extends ApiBase implements SavingsClient {
    async getCategories(): Promise<SavingsCategory[]> {
        const res = await this.request('GET', '/savings/categories');
        if (!res.ok) throw new Error('Błąd pobierania kategorii oszczędności');
        return res.json();
    }

    async createCategory(name: string): Promise<void> {
        const res = await this.request('POST', '/savings/categories', {name});
        if (!res.ok) throw new Error('Błąd podczas dodawania kategorii');
    }

    async updateCategory(id: number, name: string): Promise<void> {
        const res = await this.request('PUT', `/savings/categories/${id}`, {name});
        if (!res.ok) throw new Error('Błąd podczas zapisywania kategorii');
    }

    async deleteCategory(id: number): Promise<void> {
        const res = await this.request('DELETE', `/savings/categories/${id}`);
        if (!res.ok) {
            const msg = await res.text().catch(() => 'Błąd podczas usuwania kategorii');
            throw new Error(msg);
        }
    }

    async getAccounts(includeArchived = false): Promise<SavingsAccount[]> {
        const url = includeArchived ? '/savings/accounts?includeArchived=true' : '/savings/accounts';
        const res = await this.request('GET', url);
        if (!res.ok) throw new Error('Błąd pobierania kont oszczędnościowych');
        return res.json();
    }

    async createAccount(name: string, categoryId: number): Promise<void> {
        const res = await this.request('POST', '/savings/accounts', {name, categoryId});
        if (!res.ok) throw new Error('Błąd podczas dodawania konta');
    }

    async updateAccount(id: number, name: string, categoryId: number, isActive: boolean): Promise<void> {
        const res = await this.request('PUT', `/savings/accounts/${id}`, {name, categoryId, isActive});
        if (!res.ok) throw new Error('Błąd podczas zapisywania konta');
    }

    async getSnapshot(year: number, month: number): Promise<SavingsSnapshotResponse> {
        const res = await this.request('GET', `/savings/snapshots/${year}/${month}`);
        if (!res.ok) throw new Error('Błąd pobierania danych okresu');
        return res.json();
    }

    async saveSnapshot(year: number, month: number, entries: SaveSnapshotItem[]): Promise<void> {
        const res = await this.request('POST', `/savings/snapshots/${year}/${month}`, entries);
        if (!res.ok) throw new Error('Błąd podczas zapisywania danych');
    }

    async getCushion(): Promise<SavingsCushion> {
        const res = await this.request('GET', '/savings/cushion');
        if (!res.ok) throw new Error('Błąd pobierania ustawień poduszki');
        return res.json();
    }

    async updateCushion(request: UpdateSavingsCushionRequest): Promise<void> {
        const res = await this.request('PUT', '/savings/cushion', request);
        if (!res.ok) throw new Error('Błąd podczas zapisywania ustawień');
    }

    async getReport(): Promise<SavingsReport> {
        const res = await this.request('GET', '/savings/reports');
        if (!res.ok) throw new Error('Błąd pobierania raportów oszczędności');
        return res.json();
    }

}
