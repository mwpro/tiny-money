import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {Toaster} from "sonner";
import {Auth0Provider} from "@auth0/auth0-react";
import {ApiClientProvider} from "@/api/ApiClientProvider.tsx";
import {ConfigurationProvider} from "@/ConfigurationContext.tsx";
import * as Sentry from "@sentry/react";

export interface Configuration{
    apiUrl: string,
    auth0Domain: string,
    auth0ClientId: string,
    auth0Audience: string,
    sentryDsn?: string,
}

const config: Configuration = await (await fetch(import.meta.env.VITE_CONFIGURATION_URL)).json();

if (config.sentryDsn) {
    Sentry.init({
        dsn: config.sentryDsn,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 1.0,
    });
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Auth0Provider domain={config.auth0Domain} clientId={config.auth0ClientId} authorizationParams={{
            redirect_uri: window.location.origin,
            audience: config.auth0Audience
        }}>
            <ConfigurationProvider configuration={config}>
                <ApiClientProvider configuration={config}>
                    <Toaster />
                    <QueryClientProvider client={queryClient}>
                        <Sentry.ErrorBoundary fallback={<p>An unexpected error has occurred.</p>}>
                            <App />
                        </Sentry.ErrorBoundary>
                    </QueryClientProvider>
                </ApiClientProvider>
            </ConfigurationProvider>
        </Auth0Provider>
    </React.StrictMode>,
)

