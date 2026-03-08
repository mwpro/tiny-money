import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import type {Subcategories, Tag, Transaction, TransactionsResponse, Vendor} from "@/api/ApiTypes.ts";
import {Curr} from "@/components/Curr.tsx";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ShieldCheck, SquarePen, Trash2} from "lucide-react";
import {useConfiguration} from "@/ConfigurationContext.tsx";

interface TransactionsTableProps {
    transactions: TransactionsResponse;
    vendors: Vendor[];
    subcategories: Subcategories,
    tags: Tag[],
    onDeleteClick: (transaction: Transaction) => void
    onEditClick: (transaction: Transaction) => void
    onVerifyClick: (transaction: Transaction) => void
    verifyingTransactionId?: number
    selectedIds: Set<number>;
    onSelectionChange: (ids: Set<number>) => void;
}


export function TransactionsTable({transactions, vendors, subcategories, tags, onEditClick, onDeleteClick, onVerifyClick, verifyingTransactionId, selectedIds, onSelectionChange}: TransactionsTableProps) {
    const { unknownVendorId, uncategorizedSubcategoryId } = useConfiguration();
    const getVendorName = (id: number) => {
        return vendors.find(v => v.id === id)?.name || "-"
    }

    const getSubcategoryName = (id: number) => {
        return subcategories.get(id) || "-"
    }

    const getTagNames = (ids: number[]) => {
        if (!ids || ids.length === 0) return [];
        return ids.map(id => tags.find(t => t.id === id)).filter(Boolean).map(x => x!);
    }

    const allIds = transactions.transactions.map(t => t.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
    const someSelected = allIds.some(id => selectedIds.has(id)) && !allSelected;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(allIds));
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        onSelectionChange(next);
    };

    return (
    <div className="border rounded-md">
        <Table>
            <TableHeader>
                <TableRow className={"border-l-4 border-l-transparent"}>
                    <TableHead className="w-10">
                        <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={handleSelectAll}
                            aria-label="Zaznacz wszystkie"
                        />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Sprzedawca</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Tagi</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.transactions.length == 0 &&
                    <TableRow>
                        <TableCell colSpan={8} className={"text-center"}>
                            <Alert className="mb-6" variant="default">
                                <AlertTitle>Nie znaleziono transakcji.</AlertTitle>
                            </Alert>
                        </TableCell>
                    </TableRow> }
                {transactions.transactions.map((t) => (
                    <TableRow key={t.id}
                        className={t.isPossibleDuplicate ? "border-l-4 border-l-red-500" : !t.isVerified ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-transparent"}
                        title={!t.isVerified && t.isPossibleDuplicate ? "Niezweryfikowana · Możliwy duplikat" : !t.isVerified ? "Niezweryfikowana" : t.isPossibleDuplicate ? "Możliwy duplikat" : undefined}>
                        <TableCell>
                            <Checkbox
                                    checked={selectedIds.has(t.id)}
                                    onCheckedChange={(checked) => handleSelectOne(t.id, !!checked)}
                                    aria-label={`Zaznacz transakcję ${t.id}`}
                            />
                        </TableCell>
                        <TableCell>
                            {format(new Date(t.transactionDate), dateFormat)}
                        </TableCell>
                        <TableCell>{getSubcategoryName(t.subcategoryId)}</TableCell>
                        <TableCell>{getVendorName(t.vendorId)}</TableCell>
                        <TableCell className="font-medium whitespace-pre-wrap">{t.description}</TableCell>
                        <TableCell>
                            <div className="flex gap-1 flex-wrap">
                                {getTagNames(t.tagIds).map((tag) => (
                                    <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <Curr input={t.amount} colored isPositive={!t.isExpense} />
                        </TableCell>
                        <TableCell>
                            <ButtonGroup>
                                {!t.isVerified && t.vendorId !== unknownVendorId && t.subcategoryId !== uncategorizedSubcategoryId && (
                                    <Button
                                        variant="outline" size="sm"
                                        className="hover:bg-green-100 hover:text-green-700 hover:border-green-400"
                                        onClick={() => onVerifyClick(t)}
                                        disabled={verifyingTransactionId === t.id}
                                        title="Zweryfikuj"
                                    >
                                        <ShieldCheck />
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => onEditClick(t)}><SquarePen /></Button>
                                <Button variant="outline" size="sm" className={"hover:bg-destructive hover:text-white"} onClick={() => onDeleteClick(t)}><Trash2 /></Button>
                            </ButtonGroup>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                {transactions.summary.expensesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={6}>Razem - wydatki ({transactions.summary.expensesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.expensesTotal} colored isPositive={false} /></TableCell>
                    <TableCell />
                </TableRow>}
                {transactions.summary.incomesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={6}>Razem - przychody ({transactions.summary.incomesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.incomesTotal} colored /></TableCell>
                    <TableCell />
                </TableRow>}
                {transactions.summary.expensesCount > 0 && transactions.summary.incomesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={6}>Bilans ({transactions.summary.expensesCount + transactions.summary.incomesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.balance} colored /></TableCell>
                    <TableCell />
                </TableRow>}
            </TableFooter>
        </Table>
    </div>
    );
}
