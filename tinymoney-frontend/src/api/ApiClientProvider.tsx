import {useAuth0} from "@auth0/auth0-react";
import React, {createContext} from "react";
import {type Configuration} from "@/main.tsx";
import type {ApiClient} from "@/api/ApiClient.ts";
import {ApiClientImpl} from "@/api/ApiClientImpl.ts";

export interface ApiClientProviderProps{
    configuration: Configuration,
    children?: React.ReactNode
}

export const ApiClientContext = createContext<ApiClient | undefined>(undefined);

export function ApiClientProvider(props: ApiClientProviderProps) {
    const auth = useAuth0();
    const apiClient = new ApiClientImpl(auth, props.configuration);

    return (<ApiClientContext.Provider value={apiClient}>
        {props.children}
    </ApiClientContext.Provider>)
}

export const useApiClient = () => {
    const client = React.useContext(ApiClientContext)
    
    if (!client) {
        throw new Error('No ApiClient set, use ApiClientProvider to set one')
    }

    return client
}