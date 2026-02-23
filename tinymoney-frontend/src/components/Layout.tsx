import {Outlet, Link, useLocation} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {useAuth0} from "@auth0/auth0-react";
import {endOfMonth, startOfMonth} from "date-fns";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {
    DropdownMenu,
    DropdownMenuGroup,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem
} from "./ui/dropdown-menu";
import {ChevronDownIcon} from "lucide-react";
import {getTransactionsUrl} from "@/lib/utils.ts";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="border-b bg-white">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tight">TINY-Money</span>

                        <nav className="flex gap-4">
                            <Button variant={isActive("/dashboard") ? "secondary" : "ghost"} asChild>
                                <Link to="/dashboard">Dashboard</Link>
                            </Button>
                            <Button variant={isActive("/transactions") ? "secondary" : "ghost"} asChild>
                                <Link to={getTransactionsUrl({
                                    dateFrom: startOfMonth(new Date()),
                                    dateTo: endOfMonth(new Date())
                                })}>Transakcje
                                </Link>
                            </Button>
                            <Button variant={isActive("/budgets") ? "secondary" : "ghost"} asChild>
                                <Link to="/budgets">Budżet</Link>
                            </Button>
                            <Button variant="ghost" asChild>
                                <Link to="https://tinymoneystorageprod.z6.web.core.windows.net/buffer"
                                      target="_blank">Import</Link>
                            </Button>
                            <ButtonGroup>
                                <Button variant={isActive("/reports") ? "secondary" : "ghost"}>Raporty</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={isActive("/reports") ? "secondary" : "ghost"}
                                                className="!pl-2">
                                            <ChevronDownIcon/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem asChild>
                                                <Link to="/reports/summary">Podsumowanie</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="/reports/top-list">Top lista</Link>
                                            </DropdownMenuItem>
                                            
                                            <DropdownMenuItem asChild>
                                                <Link to="/reports/sankey">Sankey</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="https://tinymoneystorageprod.z6.web.core.windows.net/reports"
                                                      target="_blank">Stare raporty</Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
                            <Link to="/tags">
                                <Button variant={isActive("/tags") ? "secondary" : "ghost"}>
                                    Tagi
                                </Button>
                            </Link>
                            <Link to="/vendors">
                                <Button variant={isActive("/vendors") ? "secondary" : "ghost"}>
                                    Sprzedawcy
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

            <main className="flex-1 py-8">
                <Outlet/>
            </main>
        </div>
    )
}