import { Outlet, Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function Layout() {
    const location = useLocation()

    // Prosta funkcja do sprawdzania czy link jest aktywny (dla styli)
    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* 1. GÓRNY PASEK NAWIGACYJNY */}
            <header className="border-b bg-white">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tight">Finanse Domowe</span>

                        {/* Menu */}
                        <nav className="flex gap-4">
                            <Link to="/transactions">
                                <Button variant={isActive("/transactions") ? "secondary" : "ghost"}>
                                    Transakcje
                                </Button>
                            </Link>
                            <Link to="/reports">
                                <Button variant={isActive("/reports") ? "secondary" : "ghost"}>
                                    Raporty
                                </Button>
                            </Link>
                        </nav>
                    </div>

                    {/* Tu kiedyś będzie avatar użytkownika / wyloguj */}
                    <div className="text-sm text-slate-500">Jan Kowalski</div>
                </div>
            </header>

            {/* 2. MIEJSCE NA ZMIENNĄ TREŚĆ (TUTAJ WSKAKUJE TransactionsPage) */}
            <main className="flex-1 py-8">
                <Outlet />
            </main>
        </div>
    )
}