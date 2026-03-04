import {Link, Outlet, useLocation} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {useAuth0} from "@auth0/auth0-react";
import {endOfMonth, startOfMonth} from "date-fns";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
    ArrowLeftRightIcon,
    BarChart2Icon,
    ChevronDownIcon,
    CoinsIcon,
    MenuIcon,
    MoonIcon,
    SunIcon,
    WalletIcon
} from "lucide-react";
import {getTransactionsUrl} from "@/lib/utils.ts";
import {useState} from "react";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";
import {useDarkMode} from "@/lib/UseDarkMode.tsx";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();
    const [moreOpen, setMoreOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [dark, toggleDark] = useDarkMode();

    const isActive = (path: string) => location.pathname === path;
    const isReportsActive = () => location.pathname.startsWith("/reports");

    return (
        <div className="min-h-dvh bg-background flex flex-col">
            <header className="hidden md:block border-b bg-header-bg text-header-fg">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <CoinsIcon className="size-5" />
                            <span className="text-lg tracking-tight leading-none">
                                <span className="font-light font-sans">tiny</span>
                                <span className="font-serif font-bold"> Money</span>
                            </span>
                        </div>

                        <nav className="flex gap-1">
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/dashboard") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/dashboard">Dashboard</Link>
                            </Button>
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/transactions") ? "bg-white/20" : ""}`} asChild>
                                <Link to={getTransactionsUrl({
                                    dateFrom: startOfMonth(new Date()),
                                    dateTo: endOfMonth(new Date())
                                })}>Transakcje
                                </Link>
                            </Button>
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/budgets") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/budgets">Budżet</Link>
                            </Button>
                            <ButtonGroup>
                                <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isReportsActive() ? "bg-white/20" : ""}`}>Raporty</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg !pl-2 ${isReportsActive() ? "bg-white/20" : ""}`}>
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
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/tags") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/tags">Tagi</Link>
                            </Button>
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/vendors") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/vendors">Sprzedawcy</Link>
                            </Button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="hover:bg-white/15 hover:text-header-fg" onClick={toggleDark} aria-label="Toggle dark mode">
                            {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
                        </Button>
                        <Button variant="ghost" className="hover:bg-white/15 hover:text-header-fg"
                            onClick={() => logout({logoutParams: {returnTo: window.location.origin}})}>
                            Wyloguj {user?.name}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-8 px-4 sm:px-6 pb-mobile-nav md:pb-8">
                <Outlet/>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-header-bg text-header-fg z-50 flex flex-col" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
            <div className="flex h-16">
                <Link to="/dashboard"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/dashboard") ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                    <CoinsIcon className="size-5"/>
                    <span className="leading-tight text-center">tiny<br/>Money</span>
                </Link>

                <Link to={getTransactionsUrl({
                    dateFrom: startOfMonth(new Date()),
                    dateTo: endOfMonth(new Date())
                })}
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/transactions") ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                    <ArrowLeftRightIcon className="size-5"/>
                    <span>Transakcje</span>
                </Link>

                <Link to="/budgets"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isActive("/budgets") ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                    <WalletIcon className="size-5"/>
                    <span>Budżet</span>
                </Link>

                <Sheet open={reportsOpen} onOpenChange={setReportsOpen}>
                    <SheetTrigger asChild>
                        <button className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isReportsActive() ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
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
                        <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-header-fg/60">
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

                            <Button variant="ghost" className="justify-start w-full" onClick={toggleDark}>
                                {dark ? <SunIcon className="size-4 mr-2" /> : <MoonIcon className="size-4 mr-2" />}
                                {dark ? 'Jasny motyw' : 'Ciemny motyw'}
                            </Button>

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
