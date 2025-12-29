import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. Importy
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {Toaster} from "sonner";

// 2. Utworzenie klienta (to nasz cache)
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Toaster />
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)