import {Fragment, useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useForm} from "react-hook-form";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {prepareTitleText} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group.tsx";
import {toast} from "sonner";
import type {SaveSnapshotItem, SavingsSnapshotEntry} from "@/api/ApiTypes.ts";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {Link} from "react-router-dom";

type SnapshotForm = {
    entries: SaveSnapshotItem[];
};

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
    const [period, setPeriod] = useState<MonthSelection>({year: now.getFullYear(), month: now.getMonth() + 1});
    const {year, month} = period;

    const snapshotQuery = useQuery({
        queryKey: ['savings-snapshot', year, month],
        queryFn: () => savingsClient.getSnapshot(year, month)
    });

    const {register, handleSubmit, reset} = useForm<SnapshotForm>({
        defaultValues: {entries: []}
    });

    useEffect(() => {
        if (snapshotQuery.data) {
            reset({
                entries: snapshotQuery.data.map(e => ({
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

    const entries = snapshotQuery.data ?? [];
    const groups = groupByCategory(entries);

    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Oszczędności")}</title>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold font-serif">Oszczędności</h1>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <MonthPicker month={period} onChange={setPeriod} endMonth={now} />
                    <Button variant="outline" asChild>
                        <Link to="/savings/accounts">Zarządzaj kontami</Link>
                    </Button>
                </div>
            </div>

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
                                            <TableCell colSpan={4} className="font-semibold text-sm py-2">
                                                {group.categoryName}
                                            </TableCell>
                                        </TableRow>
                                        {group.indices.map(index => (
                                            <TableRow key={entries[index].accountId}>
                                                <input type="hidden"
                                                       {...register(`entries.${index}.accountId`, {valueAsNumber: true})} />
                                                <TableCell>{entries[index].accountName}</TableCell>
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
