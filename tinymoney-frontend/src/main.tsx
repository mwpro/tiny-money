import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {Toaster} from "sonner";
import {Auth0Provider} from "@auth0/auth0-react";
import type {AppState} from "@auth0/auth0-react";
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

let config: Configuration | undefined;
try {
    const response = await fetch(import.meta.env.VITE_CONFIGURATION_URL);
    if (!response.ok) {
        throw new Error("Could not get configuration");
    }
    config = await response.json();
} catch {
    document.getElementById('splash')!.style.display = 'none';
    document.getElementById('config-error')!.style.display = 'block';
}

if (config) {
    if (config.sentryDsn) {
        Sentry.init({
            dsn: config.sentryDsn,
            integrations: [Sentry.browserTracingIntegration()],
            tracesSampleRate: 1.0,
        });
    }

    const queryClient = new QueryClient()

    function onRedirectCallback(appState?: AppState) {
        window.history.replaceState({}, document.title, appState?.returnTo ?? window.location.pathname);
    }

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <Auth0Provider domain={config.auth0Domain} clientId={config.auth0ClientId} authorizationParams={{
                redirect_uri: window.location.origin,
                audience: config.auth0Audience
            }} onRedirectCallback={onRedirectCallback}>
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
}
