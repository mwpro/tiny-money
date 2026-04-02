import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import { Layout } from "@/components/Layout"
import { TransactionsPage } from "@/features/transactions/TransactionsPage"
import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useState} from "react";
import {BudgetsPage} from "@/features/budgets/BudgetsPage.tsx";
import {DashboardPage} from "@/features/dashboard/DashboardPage.tsx";
import {CoinsIcon, AlertCircleIcon} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {SummaryReportPage} from "@/features/reports/summary-report/SummaryReportPage.tsx";
import {TopListReportPage} from "@/features/reports/toplist-report/TopListReportPage.tsx";
import {SankeyReportPage} from "@/features/reports/SankeyReportPage.tsx";
import {TagsPage} from "@/features/tags/TagsPage.tsx";
import {VendorsPage} from "@/features/vendors/VendorsPage.tsx";
import {SettingsPage} from "@/features/settings/SettingsPage.tsx";
import {PlansPage} from "@/features/plans/PlansPage.tsx";
import {PlanDetailPage} from "@/features/plans/PlanDetailPage.tsx";
import {SavingsAccountsPage} from "@/features/savings/SavingsAccountsPage.tsx";

function App() {
    const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();
    const [splashVisible, setSplashVisible] = useState(true);
    const [splashRendered, setSplashRendered] = useState(true);

    useEffect(() => {
        // Remove the static HTML splash now that React has taken over
        document.getElementById('splash')?.remove();
    }, []);

    useEffect(() => {
        if (!isLoading && !error) {
            setSplashVisible(false);
        } else if (isLoading) {
            setSplashVisible(true);
            setSplashRendered(true);
        }
    }, [isLoading, error]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !error) {
            loginWithRedirect({
                appState: { returnTo: window.location.pathname + window.location.search }
            });
        }
    }, [isLoading, isAuthenticated, error, loginWithRedirect]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <Alert className="max-w-md" variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>Ups!</AlertTitle>
                    <AlertDescription>
                        <p>Wystąpił błąd.</p>
                        <p>{error.message}</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            {splashRendered && (
                <div
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-header-bg text-header-fg transition-opacity duration-500 ${splashVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onTransitionEnd={() => { if (!splashVisible) setSplashRendered(false); }}
                >
                    <CoinsIcon className="size-14" strokeWidth={1.5} />
                    <div className="text-2xl tracking-tight leading-none">
                        <span className="font-light font-sans">tiny</span>
                        <span className="font-serif font-bold"> Money</span>
                    </div>
                </div>
            )}

            {isAuthenticated && (
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>

                            <Route index element={<Navigate to="/dashboard" replace />} />

                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="transactions" element={<TransactionsPage />} />
                            <Route path="reports/summary" element={<SummaryReportPage />} />
                            <Route path="reports/top-list" element={<TopListReportPage />} />
                            <Route path="reports/sankey" element={<SankeyReportPage />} />
                            <Route path="budgets" element={<BudgetsPage />} />
                            <Route path="plans" element={<PlansPage />} />
                            <Route path="plans/:planId" element={<PlanDetailPage />} />
                            <Route path="savings" element={<Navigate to="/savings/accounts" replace />} />
                            <Route path="savings/accounts" element={<SavingsAccountsPage />} />
                            <Route path="tags" element={<TagsPage />} />
                            <Route path="vendors" element={<VendorsPage />} />
                            <Route path="settings" element={<SettingsPage />} />

                            {/*fallback*/}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            )}
        </>
    )
}

export default App