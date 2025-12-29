// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { TransactionsPage } from "@/features/transactions/TransactionsPage"

// Możesz stworzyć pusty komponent dla raportów na razie, żeby link działał
const ReportsPage = () => <div className="text-center p-10 text-2xl">Tutaj będą wykresy 📈</div>

function App() {
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