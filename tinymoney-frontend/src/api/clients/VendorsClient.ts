import type {Vendor, VendorDetails} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";
import type {VendorInputs} from "@/features/vendors/VendorEditorDialog.tsx";

export interface VendorsClient {
    getVendors(): Promise<Vendor[]>;
    getVendorsDetails(): Promise<VendorDetails[]>;
    addVendor(newVendor: VendorInputs): Promise<void>;
    editVendor(vendorId: number, newVendor: VendorInputs): Promise<void>;
    removeVendor(vendorId: number, vendorIdToMerge: number | undefined): Promise<void>;
}

export class VendorsClientImpl extends ApiBase implements VendorsClient {
    async getVendors(): Promise<Vendor[]> {
        const res = await this.request('GET', '/vendors');
        if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
        return res.json();
    }

    async getVendorsDetails(): Promise<VendorDetails[]> {
        const res = await this.request('GET', '/vendors?detailed=true');
        if (!res.ok) throw new Error('Błąd pobierania sprzedawców');
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
}
