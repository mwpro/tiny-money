import type {Category, DetailedCategory} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";

export interface CategoriesClient {
    getCategories(): Promise<Category[]>;
    getCategoriesDetailed(): Promise<DetailedCategory[]>;
    createCategory(name: string, isIncome: boolean): Promise<void>;
    updateCategory(id: number, name: string): Promise<void>;
    deleteCategory(id: number): Promise<void>;
    restoreCategory(id: number): Promise<void>;
    moveCategoryUp(id: number): Promise<void>;
    moveCategoryDown(id: number): Promise<void>;
    createSubcategory(categoryId: number, name: string): Promise<void>;
    updateSubcategory(id: number, categoryId: number, name: string, parentCategoryId: number): Promise<void>;
    deleteSubcategory(categoryId: number, id: number): Promise<void>;
    restoreSubcategory(categoryId: number, id: number): Promise<void>;
    moveSubcategoryUp(categoryId: number, id: number): Promise<void>;
    moveSubcategoryDown(categoryId: number, id: number): Promise<void>;
}

export class CategoriesClientImpl extends ApiBase implements CategoriesClient {
    async getCategories(): Promise<Category[]> {
        const res = await this.request('GET', '/categories');
        if (!res.ok) throw new Error('Błąd pobierania kategorii');
        return res.json();
    }

    async getCategoriesDetailed(): Promise<DetailedCategory[]> {
        const res = await this.request('GET', '/categories?detailed=true');
        if (!res.ok) throw new Error('Błąd pobierania kategorii');
        return res.json();
    }

    async createCategory(name: string, isIncome: boolean): Promise<void> {
        const res = await this.request('POST', '/categories', {name, isIncome});
        if (!res.ok) throw new Error('Błąd tworzenia kategorii');
    }

    async updateCategory(id: number, name: string): Promise<void> {
        const res = await this.request('PUT', `/categories/${id}`, {name});
        if (!res.ok) throw new Error('Błąd aktualizacji kategorii');
    }

    async deleteCategory(id: number): Promise<void> {
        const res = await this.request('DELETE', `/categories/${id}`);
        if (!res.ok) throw new Error('Błąd usuwania kategorii');
    }

    async restoreCategory(id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${id}/restore`);
        if (!res.ok) throw new Error('Błąd przywracania kategorii');
    }

    async moveCategoryUp(id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${id}/move-up`);
        if (!res.ok) throw new Error('Błąd przesuwania kategorii');
    }

    async moveCategoryDown(id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${id}/move-down`);
        if (!res.ok) throw new Error('Błąd przesuwania kategorii');
    }

    async createSubcategory(categoryId: number, name: string): Promise<void> {
        const res = await this.request('POST', `/categories/${categoryId}/subcategories`, {name});
        if (!res.ok) throw new Error('Błąd tworzenia podkategorii');
    }

    async updateSubcategory(id: number, categoryId: number, name: string, parentCategoryId: number): Promise<void> {
        const res = await this.request('PUT', `/categories/${categoryId}/subcategories/${id}`, {name, parentCategoryId});
        if (!res.ok) throw new Error('Błąd aktualizacji podkategorii');
    }

    async deleteSubcategory(categoryId: number, id: number): Promise<void> {
        const res = await this.request('DELETE', `/categories/${categoryId}/subcategories/${id}`);
        if (!res.ok) throw new Error('Błąd usuwania podkategorii');
    }

    async restoreSubcategory(categoryId: number, id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${categoryId}/subcategories/${id}/restore`);
        if (!res.ok) throw new Error('Błąd przywracania podkategorii');
    }

    async moveSubcategoryUp(categoryId: number, id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${categoryId}/subcategories/${id}/move-up`);
        if (!res.ok) throw new Error('Błąd przesuwania podkategorii');
    }

    async moveSubcategoryDown(categoryId: number, id: number): Promise<void> {
        const res = await this.request('POST', `/categories/${categoryId}/subcategories/${id}/move-down`);
        if (!res.ok) throw new Error('Błąd przesuwania podkategorii');
    }
}
