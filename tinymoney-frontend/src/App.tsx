// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { TransactionsPage } from "@/features/transactions/TransactionsPage"
import {useAuth0} from "@auth0/auth0-react";
import {useEffect} from "react";

// Możesz stworzyć pusty komponent dla raportów na razie, żeby link działał
const ReportsPage = () => <div className="text-center p-10 text-2xl">Tutaj będą wykresy 📈</div>

function App() {
    const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !error) {
            loginWithRedirect();
        }
    }, [isLoading, isAuthenticated, error, loginWithRedirect]);
    
    if (isLoading) {
        return (
            <div className="app-container">
                <div className="loading-state">
                    <div className="loading-text">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="error-state">
                    <div className="error-title">Oops!</div>
                    <div className="error-message">Something went wrong</div>
                    <div className="error-sub-message">{error.message}</div>
                </div>
            </div>
        );
    }
    
    return (
        <BrowserRouter>
            <Routes>
                {/* Ścieżka główna otacza wszystko Layoutem */}
                <Route path="/" element={<Layout />}>

                    {/* Przekierowanie: Jak wejdziesz na "/", idź od razu do "/transactions" */}
                    <Route index element={<Navigate to="/transactions" replace />} />

                    {/* Konkretne podstrony */}
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="reports" element={<ReportsPage />} />

                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App