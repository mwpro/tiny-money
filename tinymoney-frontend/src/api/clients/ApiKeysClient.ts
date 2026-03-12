import {ApiBase} from "@/api/ApiBase.ts";
import type {ApiKeySummary, CreateApiKeyRequest, CreateApiKeyResponse} from "@/api/ApiTypes.ts";

export interface ApiKeysClient {
    getApiKeys(): Promise<ApiKeySummary[]>;
    createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;
    deleteApiKey(id: number): Promise<void>;
}

export class ApiKeysClientImpl extends ApiBase implements ApiKeysClient {
    async getApiKeys(): Promise<ApiKeySummary[]> {
        const res = await this.request('GET', '/api-keys');
        if (!res.ok) throw new Error('Failed to load API keys');
        return res.json();
    }

    async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
        const res = await this.request('POST', '/api-keys', request);
        if (!res.ok) throw new Error('Failed to create API key');
        return res.json();
    }

    async deleteApiKey(id: number): Promise<void> {
        const res = await this.request('DELETE', `/api-keys/${id}`);
        if (!res.ok) throw new Error('Failed to delete API key');
    }
}
