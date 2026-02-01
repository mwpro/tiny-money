import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import { Layout } from "@/components/Layout"
import { TransactionsPage } from "@/features/transactions/TransactionsPage"
import {useAuth0} from "@auth0/auth0-react";
import {useEffect} from "react";
import {BudgetsPage} from "@/features/budgets/BudgetsPage.tsx";
import {DashboardPage} from "@/features/dashboard/DashboardPage.tsx";
import {Spinner} from "@/components/ui/spinner.tsx";
import {AlertCircleIcon} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {ReportsPage} from "@/features/reports/ReportsPage.tsx";

function App() {
    const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !error) {
            loginWithRedirect();
        }
    }, [isLoading, isAuthenticated, error, loginWithRedirect]);
    
    if (isLoading || error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <header className="border-b bg-white">
                    <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
                        <div className="flex items-center gap-8 text-center">
                            <span className="text-xl font-bold tracking-tight">TINY-Money</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 py-8">
                    {isLoading && 
                        <div className="max-w-7xl mx-auto text-2xl flex items-center flex-col gap-3">
                            <div>Ładowanie</div>
                            <Spinner className="size-8" />
                        </div>}
                    {error &&
                        <Alert className="max-w-7xl mx-auto mb-6" variant="destructive">
                            <AlertCircleIcon />
                            <AlertTitle>Ups!</AlertTitle>
                            <AlertDescription>
                                <p>Wystąpił błąd.</p>
                                <p>{error.message}</p>
                            </AlertDescription>
                        </Alert>}
                </main>
            </div>
        );
    }
    
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>

                    <Route index element={<Navigate to="/dashboard" replace />} />

                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="budgets" element={<BudgetsPage />} />

                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App