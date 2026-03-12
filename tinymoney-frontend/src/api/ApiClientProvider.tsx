import {useAuth0} from "@auth0/auth0-react";
import React, {createContext} from "react";
import {type Configuration} from "@/main.tsx";
import type {ApiClient} from "@/api/ApiClient.ts";
import {TransactionsClientImpl} from "@/api/clients/TransactionsClient.ts";
import {TagsClientImpl} from "@/api/clients/TagsClient.ts";
import {VendorsClientImpl} from "@/api/clients/VendorsClient.ts";
import {CategoriesClientImpl} from "@/api/clients/CategoriesClient.ts";
import {BudgetClientImpl} from "@/api/clients/BudgetClient.ts";
import {ReportsClientImpl} from "@/api/clients/ReportsClient.ts";
import {ApiKeysClientImpl} from "@/api/clients/ApiKeysClient.ts";

export interface ApiClientProviderProps{
    configuration: Configuration,
    children?: React.ReactNode
}

export const ApiClientContext = createContext<ApiClient | undefined>(undefined);

export function ApiClientProvider(props: ApiClientProviderProps) {
    const auth = useAuth0();
    const apiClient: ApiClient = {
        transactionsClient: new TransactionsClientImpl(auth, props.configuration.apiUrl),
        tagsClient: new TagsClientImpl(auth, props.configuration.apiUrl),
        vendorsClient: new VendorsClientImpl(auth, props.configuration.apiUrl),
        categoriesClient: new CategoriesClientImpl(auth, props.configuration.apiUrl),
        budgetClient: new BudgetClientImpl(auth, props.configuration.apiUrl),
        reportsClient: new ReportsClientImpl(auth, props.configuration.apiUrl),
        apiKeysClient: new ApiKeysClientImpl(auth, props.configuration.apiUrl),
    };

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
