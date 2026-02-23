import {useQuery} from "@tanstack/react-query"
import {getVendorsDetails, type VendorDetails} from "@/lib/api"
import {useAuth0} from "@auth0/auth0-react";
import {useState} from "react";
import {Link} from "react-router-dom";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Button} from "@/components/ui/button.tsx";
import {dateFormat, getTransactionsUrl, prepareTitleText} from "@/lib/utils.ts";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {format} from "date-fns";
import {VendorRemovalDialog} from "@/features/vendors/VendorRemovalDialog.tsx";
import {VendorEditorDialog} from "@/features/vendors/VendorEditorDialog.tsx";

export function VendorsPage() {
    const auth = useAuth0();
    const [vendorToRemove, setVendorToRemove] = useState<VendorDetails | undefined>(undefined)
    const [vendorToEdit, setVendorToEdit] = useState<VendorDetails | undefined>(undefined)
    const [vendorsWithoutTransactionsFilter, setVendorsWithoutTransactionsFilter] = useState(false);

    const vendorsQuery = useQuery({
        queryKey: ['vendors-details'],
        queryFn: () => getVendorsDetails(auth)
    })
    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Sprzedawcy")}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Sprzedawcy</h1>
                <VendorEditorDialog vendorToEdit={vendorToEdit} onClose={() => setVendorToEdit(undefined)} />
                {vendorsQuery.data && <VendorRemovalDialog vendorToRemove={vendorToRemove} vendors={vendorsQuery.data}/> }
            </div>
            <div className="flex flex-row gap-3 mb-6">
                <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" size="sm" checked={vendorsWithoutTransactionsFilter} onCheckedChange={setVendorsWithoutTransactionsFilter} />
                    <Label htmlFor="airplane-mode">Sprzedawcy bez transakcji</Label>
                </div>
            </div>

            {vendorsWithoutTransactionsFilter}
            {vendorsQuery.isLoading &&
                <div className="p-10">Ładowanie danych...</div>}
            {vendorsQuery.isError &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {vendorsQuery.data &&
                <div className="border rounded-md">
                    <Table className={"table-auto"}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sprzedawca</TableHead>
                                <TableHead>Domyślna kategoria</TableHead>
                                <TableHead>Data ostatniej transakcji</TableHead>
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
                            {vendorsQuery.data.filter(t => !vendorsWithoutTransactionsFilter || t.numberOfTransactions == 0).map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        {t.name}
                                    </TableCell>
                                    <TableCell>{t.categoryName} / {t.subcategoryName}</TableCell>
                                    <TableCell>{t.lastTransactionDate ? format(new Date(t.lastTransactionDate), dateFormat) : "brak"}</TableCell>
                                    <TableCell className={"flex justify-end"}>
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