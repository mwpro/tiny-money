import {Outlet, Link, useLocation} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {useAuth0} from "@auth0/auth0-react";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();

    // Prosta funkcja do sprawdzania czy link jest aktywny (dla styli)
    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* 1. GÓRNY PASEK NAWIGACYJNY */}
            <header className="border-b bg-white">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tight">TINY-Money</span>

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

                    <Button
                        onClick={() => logout({logoutParams: {returnTo: window.location.origin}})}
                        variant={"ghost"}
                    >
                        Wyloguj {user?.name}
                    </Button>
                </div>
            </header>

            {/* 2. MIEJSCE NA ZMIENNĄ TREŚĆ (TUTAJ WSKAKUJE TransactionsPage) */}
            <main className="flex-1 py-8">
                <Outlet/>
            </main>
        </div>
    )
}