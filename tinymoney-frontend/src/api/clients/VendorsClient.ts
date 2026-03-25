import type {VendorAlias, VendorDetails, VendorSuggestion, VendorWithAliases} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";
import type {VendorInputs} from "@/features/vendors/VendorEditorDialog.tsx";

export interface VendorsClient {
    getVendorsDetails(): Promise<VendorDetails[]>;
    addVendor(newVendor: VendorInputs): Promise<void>;
    editVendor(vendorId: number, newVendor: VendorInputs): Promise<void>;
    removeVendor(vendorId: number, vendorIdToMerge: number | undefined): Promise<void>;
    getVendor(vendorId: number): Promise<VendorWithAliases>;
    addVendorAlias(vendorId: number, alias: string): Promise<VendorAlias>;
    deleteVendorAlias(vendorId: number, aliasId: number): Promise<void>;
    autocompleteVendors(query: string): Promise<VendorSuggestion[]>;
}

export class VendorsClientImpl extends ApiBase implements VendorsClient {
    async getVendorsDetails(): Promise<VendorDetails[]> {
        const res = await this.request('GET', '/vendors');
        if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
        return res.json();
    }

    async autocompleteVendors(query: string): Promise<VendorSuggestion[]> {
        const res = await this.request('GET', `/vendors/autocomplete?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Błąd pobierania sugestii sprzedawców');
        return res.json();
    }

    async addVendor(newVendor: VendorInputs): Promise<void> {
        const res = await this.request('POST', '/vendors', newVendor);
        if (!res.ok) throw new Error('Błąd podczas dodawania sprzedawcy');
    }

    async editVendor(vendorId: number, newVendor: VendorInputs): Promise<void> {
        const res = await this.request('PUT', `/vendors/${vendorId}`, newVendor);
        if (!res.ok) throw new Error('Błąd podczas zapisywania sprzedawcy');
    }

    async removeVendor(vendorId: number, vendorIdToMerge: number | undefined): Promise<void> {
        const res = await this.request('DELETE', `/vendors/${vendorId}`, {mergeToVendorId: vendorIdToMerge});
        if (!res.ok) throw new Error('Błąd podczas usuwania sprzedawcy');
    }

    async getVendor(vendorId: number): Promise<VendorWithAliases> {
        const res = await this.request('GET', `/vendors/${vendorId}`);
        if (!res.ok) throw new Error('Błąd pobierania sprzedawcy');
        return res.json();
    }

    async addVendorAlias(vendorId: number, alias: string): Promise<VendorAlias> {
        const res = await this.request('POST', `/vendors/${vendorId}/aliases`, {alias});
        if (!res.ok) throw new Error('Błąd podczas dodawania aliasu');
        return res.json();
    }

    async deleteVendorAlias(vendorId: number, aliasId: number): Promise<void> {
        const res = await this.request('DELETE', `/vendors/${vendorId}/aliases/${aliasId}`);
        if (!res.ok) throw new Error('Błąd podczas usuwania aliasu');
    }

}
