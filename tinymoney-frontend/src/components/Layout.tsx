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
import {ArrowLeftRightIcon, BarChart2Icon, ChevronDownIcon, LayoutDashboardIcon, MenuIcon, WalletIcon} from "lucide-react";
import {getTransactionsUrl} from "@/lib/utils.ts";
import {useState} from "react";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();
    const [moreOpen, setMoreOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;
    const isReportsActive = () => location.pathname.startsWith("/reports");

    return (
        <div className="min-h-dvh bg-slate-50 flex flex-col">
            <header className="hidden md:block border-b bg-white">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
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
                            <ButtonGroup>
                                <Button variant={isReportsActive() ? "secondary" : "ghost"}>Raporty</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={isReportsActive() ? "secondary" : "ghost"}
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

            <main className="flex-1 py-8 px-4 sm:px-6 pb-mobile-nav md:pb-8">
                <Outlet/>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-50 flex flex-col" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
            <div className="flex h-16">
                <Link to="/dashboard"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/dashboard") ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    <LayoutDashboardIcon className="size-5"/>
                    <span className="leading-tight text-center">TINY<br/>Money</span>
                </Link>

                <Link to={getTransactionsUrl({
                    dateFrom: startOfMonth(new Date()),
                    dateTo: endOfMonth(new Date())
                })}
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/transactions") ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    <ArrowLeftRightIcon className="size-5"/>
                    <span>Transakcje</span>
                </Link>

                <Link to="/budgets"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/budgets") ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    <WalletIcon className="size-5"/>
                    <span>Budżet</span>
                </Link>

                <Sheet open={reportsOpen} onOpenChange={setReportsOpen}>
                    <SheetTrigger asChild>
                        <button className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isReportsActive() ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            <BarChart2Icon className="size-5"/>
                            <span>Raporty</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="p-4 pb-8 flex flex-col gap-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">Raporty</p>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/summary" onClick={() => setReportsOpen(false)}>Podsumowanie</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/top-list" onClick={() => setReportsOpen(false)}>Top lista</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/sankey" onClick={() => setReportsOpen(false)}>Sankey</Link>
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                    <SheetTrigger asChild>
                        <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-muted-foreground">
                            <MenuIcon className="size-5"/>
                            <span>Więcej</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="p-4 pb-8 flex flex-col gap-1">
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/tags" onClick={() => setMoreOpen(false)}>Tagi</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/vendors" onClick={() => setMoreOpen(false)}>Sprzedawcy</Link>
                            </Button>

                            <div className="border-t my-1"/>

                            <Button variant="ghost" className="justify-start w-full"
                                    onClick={() => {
                                        logout({logoutParams: {returnTo: window.location.origin}});
                                        setMoreOpen(false);
                                    }}>
                                Wyloguj {user?.name}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            </nav>
        </div>
    )
}
