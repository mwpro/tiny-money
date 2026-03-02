import type {Category} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface CategoriesClient {
    getCategories(): Promise<Category[]>;
}

export class CategoriesClientImpl extends ApiBase implements CategoriesClient {
    async getCategories(): Promise<Category[]> {
        const res = await this.request('GET', '/categories');
        if (!res.ok) throw new Error('Błąd pobierania kategorii');
        return res.json();
    }
}
