import {Outlet, Link, useLocation} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {useAuth0} from "@auth0/auth0-react";
import {endOfMonth, format, startOfMonth} from "date-fns";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {DropdownMenu, DropdownMenuGroup, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem} from "./ui/dropdown-menu";
import {ChevronDownIcon} from "lucide-react";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();

    const isActive = (path: string) => location.pathname === path;
    const defaultTransactionsUrl = `/transactions?dateFrom=${format(startOfMonth(new Date()), "yyyy-MM-dd")}&dateTo=${format(endOfMonth(new Date()), "yyyy-MM-dd")}`

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="border-b bg-white">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-bold tracking-tight">TINY-Money</span>

                        <nav className="flex gap-4">
                            <Link to="/dashboard">
                                <Button variant={isActive("/dashboard") ? "secondary" : "ghost"}>
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to={defaultTransactionsUrl}>
                                <Button variant={isActive("/transactions") ? "secondary" : "ghost"}>
                                    Transakcje
                                </Button>
                            </Link>
                            <Link to="/budgets">
                                <Button variant={isActive("/budgets") ? "secondary" : "ghost"}>
                                    Budżet
                                </Button>
                            </Link>
                            <Link to="https://tinymoneystorageprod.z6.web.core.windows.net/buffer" target="_blank">
                                <Button variant="ghost">
                                    Import
                                </Button>
                            </Link>
                            <ButtonGroup>
                                <Button variant={isActive("/reports") ? "secondary" : "ghost"}>Raporty</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={isActive("/reports") ? "secondary" : "ghost"} className="!pl-2">
                                            <ChevronDownIcon />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuGroup>
                                            <Link to="/reports/summary">
                                                <DropdownMenuItem>
                                                    Podsumowanie
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link to="https://tinymoneystorageprod.z6.web.core.windows.net/reports" target="_blank">
                                                <DropdownMenuItem>
                                                    Stare raporty
                                                </DropdownMenuItem>
                                            </Link>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
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