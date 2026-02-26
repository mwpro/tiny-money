import React, {createContext} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {Toaster} from "sonner";
import {Auth0Provider} from "@auth0/auth0-react";

export interface Configuration{
    apiUrl: string,
    auth0Domain: string,
    auth0ClientId: string,
    auth0Audience: string,
}

const config: Configuration = await (await fetch(import.meta.env.VITE_CONFIGURATION_URL)).json();

export const ConfigContext = createContext<Configuration>({
    apiUrl: "",
    auth0Audience: "",
    auth0ClientId: "",
    auth0Domain: ""
});

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigContext value={config}>
            <Auth0Provider domain={config.auth0Domain} clientId={config.auth0ClientId} authorizationParams={{
                redirect_uri: window.location.origin,
                audience: config.auth0Audience
            }}>
                <Toaster />
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </Auth0Provider>            
        </ConfigContext>
    </React.StrictMode>,
)