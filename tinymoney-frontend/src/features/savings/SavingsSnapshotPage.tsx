import {Fragment, useEffect, useMemo} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useForm} from "react-hook-form";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {prepareTitleText} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group.tsx";
import {toast} from "sonner";
import type {SaveSnapshotItem, SavingsSnapshotEntry} from "@/api/ApiTypes.ts";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {Link, useSearchParams} from "react-router-dom";
import {Settings2} from "lucide-react";
import {parse} from "date-fns";
import {Curr} from "@/components/Curr.tsx";

type SnapshotForm = {
    entries: SaveSnapshotItem[];
};

function sumField(entries: SaveSnapshotItem[], indices: number[], field: keyof Omit<SaveSnapshotItem, 'accountId'>): number {
    return indices.reduce((sum, i) => sum + (Number(entries[i]?.[field]) || 0), 0);
}

function groupByCategory(entries: SavingsSnapshotEntry[]): {categoryName: string; indices: number[]}[] {
    const groups: {categoryName: string; indices: number[]}[] = [];
    let currentCategory = '';
    entries.forEach((entry, index) => {
        if (entry.categoryName !== currentCategory) {
            groups.push({categoryName: entry.categoryName, indices: [index]});
            currentCategory = entry.categoryName;
        } else {
            groups[groups.length - 1].indices.push(index);
        }
    });
    return groups;
}

export function SavingsSnapshotPage() {
    const {savingsClient} = useApiClient();
    const queryClient = useQueryClient();

    const now = new Date();
    const [searchParams, setSearchParams] = useSearchParams();

    const period = useMemo(() => {
        const periodStr = searchParams.get("savingsPeriod");
        const date = periodStr ? parse(periodStr, "yyyy-MM", new Date()) : now;
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }, [searchParams]);

    const handlePeriodChange = (newPeriod: MonthSelection) => {
        setSearchParams({savingsPeriod: `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}`});
    };

    useEffect(() => {
        if (!searchParams.get("savingsPeriod")) {
            handlePeriodChange(period);
        }
    }, [period]);

    const {year, month} = period;

    const snapshotQuery = useQuery({
        queryKey: ['savings-snapshot', year, month],
        queryFn: () => savingsClient.getSnapshot(year, month)
    });

    const {register, handleSubmit, reset, watch} = useForm<SnapshotForm>({
        defaultValues: {entries: []}
    });

    useEffect(() => {
        if (snapshotQuery.data) {
            reset({
                entries: snapshotQuery.data.entries.map(e => ({
                    accountId: e.accountId,
                    balance: e.balance,
                    deposited: e.deposited,
                    withdrawn: e.withdrawn
                }))
            });
        }
    }, [snapshotQuery.data, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: SnapshotForm) => savingsClient.saveSnapshot(year, month, data.entries),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-snapshot', year, month]});
            toast.success('Dane zostały zapisane');
        },
        onError: (err: Error) => toast.error(err.message)
    });

    const entries = snapshotQuery.data?.entries ?? [];
    const groups = groupByCategory(entries);
    const watchedEntries = watch('entries');

    const cushionTarget = snapshotQuery.data?.cushionTarget ?? 0;
    const cushionActual = snapshotQuery.data?.cushionActual ?? 0;
    const cushionPct = cushionTarget > 0 ? Math.min(cushionActual / cushionTarget, 1) : 0;
    const cushionMet = cushionActual >= cushionTarget;

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Oszczędności")}</title>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold font-serif">Oszczędności</h1>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <MonthPicker month={period} onChange={handlePeriodChange} endMonth={now} />
                    <Button variant="outline" asChild>
                        <Link to="/savings/accounts">Zarządzaj kontami</Link>
                    </Button>
                </div>
            </div>

            {cushionTarget > 0 && (
                <div className="flex items-center gap-3 mb-6 p-3 border rounded-md bg-muted/30">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Poduszka finansowa</span>
                            <span className={`text-sm ${cushionMet ? 'text-income' : 'text-expense'}`}>
                                <Curr input={cushionActual}/> / <Curr input={cushionTarget}/>
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${cushionMet ? 'bg-income' : 'bg-expense'}`}
                                style={{width: `${cushionPct * 100}%`}}
                            />
                        </div>
                    </div>
                    <Link to="/savings/settings" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <Settings2 size={16}/>
                    </Link>
                </div>
            )}

            {snapshotQuery.isLoading && <div className="p-10">Ładowanie danych...</div>}
            {snapshotQuery.isError && <div className="p-10 text-destructive">Błąd ładowania danych</div>}

            {snapshotQuery.data && (
                <form onSubmit={handleSubmit(data => saveMutation.mutate(data))}>
                    <div className="border rounded-md mb-4 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Konto</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Wpłacono</TableHead>
                                    <TableHead>Wypłacono</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map(group => (
                                    <Fragment key={`cat-${group.categoryName}`}>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell className="font-semibold text-sm py-2">{group.categoryName}</TableCell>
                                            <TableCell className="text-sm py-2 text-muted-foreground">{sumField(watchedEntries, group.indices, 'balance').toFixed(2)} zł</TableCell>
                                            <TableCell className="text-sm py-2 text-muted-foreground">{sumField(watchedEntries, group.indices, 'deposited').toFixed(2)} zł</TableCell>
                                            <TableCell className="text-sm py-2 text-muted-foreground">{sumField(watchedEntries, group.indices, 'withdrawn').toFixed(2)} zł</TableCell>
                                        </TableRow>
                                        {group.indices.map(index => (
                                            <TableRow key={entries[index].accountId}>
                                                <TableCell>
                                                    <input type="hidden"
                                                           {...register(`entries.${index}.accountId`, {valueAsNumber: true})} />
                                                    {entries[index].accountName}
                                                </TableCell>
                                                <TableCell>
                                                    <InputGroup className="w-36">
                                                        <InputGroupInput placeholder="0.00" type="number" step="0.01"
                                                                         {...register(`entries.${index}.balance`, {valueAsNumber: true})} />
                                                        <InputGroupAddon align="inline-end">
                                                            <InputGroupText>zł</InputGroupText>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </TableCell>
                                                <TableCell>
                                                    <InputGroup className="w-36">
                                                        <InputGroupInput placeholder="0.00" type="number" step="0.01"
                                                                         {...register(`entries.${index}.deposited`, {valueAsNumber: true})} />
                                                        <InputGroupAddon align="inline-end">
                                                            <InputGroupText>zł</InputGroupText>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </TableCell>
                                                <TableCell>
                                                    <InputGroup className="w-36">
                                                        <InputGroupInput placeholder="0.00" type="number" step="0.01"
                                                                         {...register(`entries.${index}.withdrawn`, {valueAsNumber: true})} />
                                                        <InputGroupAddon align="inline-end">
                                                            <InputGroupText>zł</InputGroupText>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </Fragment>
                                ))}
                                {entries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4}/>
                                    </TableRow>
                                )}
                            </TableBody>
                            {entries.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-semibold">Suma</TableCell>
                                        <TableCell className="font-semibold">{sumField(watchedEntries, entries.map((_, i) => i), 'balance').toFixed(2)} zł</TableCell>
                                        <TableCell className="font-semibold">{sumField(watchedEntries, entries.map((_, i) => i), 'deposited').toFixed(2)} zł</TableCell>
                                        <TableCell className="font-semibold">{sumField(watchedEntries, entries.map((_, i) => i), 'withdrawn').toFixed(2)} zł</TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
