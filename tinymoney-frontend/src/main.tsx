import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. Importy
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {Toaster} from "sonner";
import {Auth0Provider} from "@auth0/auth0-react";

// 2. Utworzenie klienta (to nasz cache)
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Auth0Provider domain={import.meta.env.VITE_AUTH0_DOMAIN} clientId={import.meta.env.VITE_AUTH0_CLIENT_ID} authorizationParams={{
            redirect_uri: window.location.origin,
            audience: import.meta.env.VITE_AUTH0_AUDIENCE
        }}>
            <Toaster />
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </Auth0Provider>
    </React.StrictMode>,
)