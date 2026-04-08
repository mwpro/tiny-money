import type {SavingsCategory, SavingsAccount, SavingsSnapshotEntry, SaveSnapshotItem, SavingsSettings, UpdateSavingsSettingsRequest} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface SavingsClient {
    getCategories(): Promise<SavingsCategory[]>;
    createCategory(name: string): Promise<void>;
    updateCategory(id: number, name: string): Promise<void>;
    deleteCategory(id: number): Promise<void>;

    getAccounts(includeArchived?: boolean): Promise<SavingsAccount[]>;
    createAccount(name: string, categoryId: number): Promise<void>;
    updateAccount(id: number, name: string, categoryId: number, isActive: boolean): Promise<void>;

    getSnapshot(year: number, month: number): Promise<SavingsSnapshotEntry[]>;
    saveSnapshot(year: number, month: number, entries: SaveSnapshotItem[]): Promise<void>;

    getSettings(): Promise<SavingsSettings>;
    updateSettings(request: UpdateSavingsSettingsRequest): Promise<void>;

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

    async getSnapshot(year: number, month: number): Promise<SavingsSnapshotEntry[]> {
        const res = await this.request('GET', `/savings/snapshots/${year}/${month}`);
        if (!res.ok) throw new Error('Błąd pobierania danych okresu');
        return res.json();
    }

    async saveSnapshot(year: number, month: number, entries: SaveSnapshotItem[]): Promise<void> {
        const res = await this.request('POST', `/savings/snapshots/${year}/${month}`, entries);
        if (!res.ok) throw new Error('Błąd podczas zapisywania danych');
    }

    async getSettings(): Promise<SavingsSettings> {
        const res = await this.request('GET', '/savings/settings');
        if (!res.ok) throw new Error('Błąd pobierania ustawień poduszki');
        return res.json();
    }

    async updateSettings(request: UpdateSavingsSettingsRequest): Promise<void> {
        const res = await this.request('PUT', '/savings/settings', request);
        if (!res.ok) throw new Error('Błąd podczas zapisywania ustawień');
    }

}
