import type {Tag} from "@/api/ApiTypes.ts";
import {ApiBase} from "@/api/ApiBase.ts";
import type {TagInputs} from "@/features/tags/TagEditorDialog.tsx";

export interface TagsClient {
    getTags(): Promise<Tag[]>;
    addTag(newTag: TagInputs): Promise<{ id: number }>;
    editTag(tagId: number, newTag: TagInputs): Promise<void>;
    removeTag(tagId: number): Promise<void>;
}

export class TagsClientImpl extends ApiBase implements TagsClient {
    async getTags(): Promise<Tag[]> {
        const res = await this.request('GET', '/tags');
        if (!res.ok) throw new Error('Błąd pobierania tagów');
        return res.json();
    }

    async addTag(newTag: TagInputs): Promise<{ id: number }> {
        const res = await this.request('POST', '/tags', newTag);
        if (!res.ok) throw new Error('Błąd podczas dodawania tagu');
        return res.json();
    }

    async editTag(tagId: number, newTag: TagInputs): Promise<void> {
        const res = await this.request('PUT', `/tags/${tagId}`, newTag);
        if (!res.ok) throw new Error('Błąd podczas zapisywania tagu');
    }

    async removeTag(tagId: number): Promise<void> {
        const res = await this.request('DELETE', `/tags/${tagId}`);
        if (!res.ok) throw new Error('Błąd podczas usuwania tagu');
    }
}
