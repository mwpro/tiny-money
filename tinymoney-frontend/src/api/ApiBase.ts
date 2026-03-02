import type {Auth0ContextInterface} from "@auth0/auth0-react";

export class ApiBase {
    protected readonly _auth: Auth0ContextInterface;
    protected readonly _apiUrl: string;

    constructor(auth: Auth0ContextInterface, apiUrl: string) {
        this._auth = auth;
        this._apiUrl = apiUrl;
    }

    protected async request(
        method: string,
        path: string,
        body?: unknown
    ): Promise<Response> {
        const token = await this._auth.getAccessTokenSilently();
        return fetch(`${this._apiUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(body !== undefined && {'Content-Type': 'application/json'}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }
}
