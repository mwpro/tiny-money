import {Link, Outlet, useLocation} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {useAuth0} from "@auth0/auth0-react";
import {endOfMonth, startOfMonth} from "date-fns";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import * as Sentry from "@sentry/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
    ArrowLeftRightIcon,
    CalendarRangeIcon,
    ChevronDownIcon,
    CoinsIcon,
    LogOutIcon,
    MenuIcon,
    MoonIcon,
    PiggyBankIcon,
    SettingsIcon,
    SunIcon,
    WalletIcon
} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {getTransactionsUrl} from "@/lib/utils.ts";
import {useState} from "react";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet.tsx";
import {useDarkMode} from "@/lib/UseDarkMode.tsx";

export function Layout() {
    const location = useLocation()
    const {logout, user} = useAuth0();
    const [moreOpen, setMoreOpen] = useState(false);
    const [dark, toggleDark] = useDarkMode();

    const isActive = (path: string) => location.pathname === path;
    const isReportsActive = () => location.pathname.startsWith("/reports");

    return (
        <div className="min-h-dvh bg-background flex flex-col">
            <header className="hidden md:block border-b bg-header-bg text-header-fg">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80">
                            <CoinsIcon className="size-5" />
                            <span className="text-lg tracking-tight leading-none">
                                <span className="font-light font-sans">tiny</span>
                                <span className="font-serif font-bold"> Money</span>
                            </span>
                        </Link>

                        <nav className="flex gap-1">
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
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${location.pathname.startsWith("/plans") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/plans">Plany</Link>
                            </Button>
                            <Button variant="ghost" className={`hover:bg-white/15 hover:text-header-fg ${location.pathname.startsWith("/savings") ? "bg-white/20" : ""}`} asChild>
                                <Link to="/savings">Oszczędności</Link>
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
                                            <DropdownMenuItem asChild>
                                                <Link to="/reports/savings">Oszczędności</Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
                        </nav>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className={`hover:bg-white/15 hover:text-header-fg ${isActive("/settings") ? "bg-white/20" : ""}`} asChild aria-label="Ustawienia">
                            <Link to="/settings"><SettingsIcon className="size-5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-white/15 hover:text-header-fg" onClick={toggleDark} aria-label="Toggle dark mode">
                            {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
                        </Button>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-white/15 hover:text-header-fg"
                                        onClick={() => logout({logoutParams: {returnTo: window.location.origin}})}>
                                        <LogOutIcon className="size-5"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Wyloguj {user?.name}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-8 px-4 sm:px-6 pb-mobile-nav md:pb-8">
                <Sentry.ErrorBoundary fallback={
                    <div className="max-w-7xl mx-auto">
                        <p className="text-destructive">Coś poszło nie tak. Odśwież stronę lub spróbuj ponownie później.</p>
                    </div>
                } key={location.pathname}>
                    <Outlet/>
                </Sentry.ErrorBoundary>
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

                <Link to="/plans"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${location.pathname.startsWith("/plans") ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                    <CalendarRangeIcon className="size-5"/>
                    <span>Plany</span>
                </Link>

                <Link to="/savings"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${location.pathname.startsWith("/savings") ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                    <PiggyBankIcon className="size-5"/>
                    <span>Oszczędności</span>
                </Link>

                <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                    <SheetTrigger asChild>
                        <button className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 ${isReportsActive() || moreOpen ? "text-header-fg font-medium" : "text-header-fg/60"}`}>
                            <MenuIcon className="size-5"/>
                            <span>Więcej</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="p-4 pb-8 flex flex-col gap-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">Raporty</p>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/summary" onClick={() => setMoreOpen(false)}>Podsumowanie</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/top-list" onClick={() => setMoreOpen(false)}>Top lista</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/sankey" onClick={() => setMoreOpen(false)}>Sankey</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/reports/savings" onClick={() => setMoreOpen(false)}>Oszczędności</Link>
                            </Button>

                            <div className="border-t my-1"/>

                            <Button variant="ghost" asChild className="justify-start w-full">
                                <Link to="/settings" onClick={() => setMoreOpen(false)}>Ustawienia</Link>
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
