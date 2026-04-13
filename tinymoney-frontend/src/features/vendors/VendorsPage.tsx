import {useQuery} from "@tanstack/react-query"
import {useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Button} from "@/components/ui/button.tsx";
import {dateFormat, getTransactionsUrl} from "@/lib/utils.ts";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {format} from "date-fns";
import {VendorRemovalDialog} from "@/features/vendors/VendorRemovalDialog.tsx";
import {VendorEditorDialog} from "@/features/vendors/VendorEditorDialog.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import type {VendorDetails} from "@/api/ApiTypes.ts";

interface ListSettings {
    withoutTransactionsFilter: boolean,
    nameFilter: string,
    subcategoryIdFilter: number | undefined
}

export function VendorsPage() {
    const { vendorsClient } = useApiClient();
    const [vendorToRemove, setVendorToRemove] = useState<VendorDetails | undefined>(undefined)
    const [vendorToEdit, setVendorToEdit] = useState<VendorDetails | undefined>(undefined)
    const [searchParams, setSearchParams] = useSearchParams();
    
    const listSettings = useMemo<ListSettings>(() => {
        const withoutTransactionsFilter = searchParams.get("withoutTransactions") == "true" ? true : false;
        const nameFilter = searchParams.get("name") ?? "";
        const subcategoryIdFilter = searchParams.get("subcategoryId") ? Number(searchParams.get("subcategoryId")) : undefined;
        return {
            withoutTransactionsFilter, nameFilter, subcategoryIdFilter
        };
    }, [searchParams]);
    
    const vendorsQuery = useQuery({
        queryKey: ['vendors-details'],
        queryFn: () => vendorsClient.getVendorsDetails()
    })
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Sprzedawcy</h2>
                <VendorEditorDialog vendorToEdit={vendorToEdit} onClose={() => setVendorToEdit(undefined)} />
            </div>
            {vendorsQuery.data && <VendorRemovalDialog vendorToRemove={vendorToRemove} vendors={vendorsQuery.data} onClose={() => setVendorToRemove(undefined)} />}
            <div className="flex flex-row gap-3 mb-6">
                <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" size="sm" checked={listSettings.withoutTransactionsFilter} onCheckedChange={v => setSearchParams(prev => {
                        v ? prev.set("withoutTransactions", "true") : prev.delete("withoutTransactions");
                        return prev;
                    })} />
                    <Label htmlFor="airplane-mode">Sprzedawcy bez transakcji</Label>
                </div>
                <Input placeholder="Wyszukaj..." className="bg-background" value={listSettings.nameFilter} onChange={v => setSearchParams(prev => {
                    (v.target.value?.length > 0) ? prev.set("name", v.target.value) : prev.delete("name");
                    return prev;
                })} />
            </div>

            {vendorsQuery.isLoading &&
                <div className="p-10">Ładowanie danych...</div>}
            {vendorsQuery.isError &&
                <div className="p-10 text-destructive">Błąd ładowania danych</div>}
            {vendorsQuery.data &&
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sprzedawca</TableHead>
                                <TableHead>Domyślna kategoria</TableHead>
                                <TableHead>Ostatnia transakcja</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendorsQuery.data.length == 0 &&
                                <TableRow>
                                    <TableCell colSpan={7} className={"text-center"}>
                                        <Alert className="mb-6" variant="default">
                                            <AlertTitle>Nie znaleziono sprzedawców.</AlertTitle>
                                        </Alert>
                                    </TableCell>
                                </TableRow> }
                            {vendorsQuery.data.filter(t => (!listSettings.withoutTransactionsFilter || t.numberOfTransactions == 0)
                                && (!listSettings.nameFilter || t.name.toLowerCase().includes(listSettings.nameFilter.toLowerCase()))
                                && (!listSettings.subcategoryIdFilter || t.defaultSubcategoryId === listSettings.subcategoryIdFilter)).map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="whitespace-break-spaces">
                                        {t.name}
                                    </TableCell>
                                    <TableCell>{t.categoryName} / {t.subcategoryName}</TableCell>
                                    <TableCell>{t.lastTransactionDate ? format(new Date(t.lastTransactionDate), dateFormat) : "brak"}</TableCell>
                                    <TableCell className={"text-right"}>
                                        <ButtonGroup>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={getTransactionsUrl({vendorId: t.id})} target={"_blank"}>
                                                    Transakcje ({t.numberOfTransactions})</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setVendorToEdit(t)}>Edytuj</Button>
                                            <Button variant="outline" className={"hover:bg-destructive hover:text-white"} size="sm" onClick={() => setVendorToRemove(t)}>Usuń</Button>
                                        </ButtonGroup>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            }
        </div>
    )
}