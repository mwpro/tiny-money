import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import type {Transaction, TransactionsResponse} from "@/api/ApiTypes.ts";
import {Curr} from "@/components/Curr.tsx";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {CheckSquare, Scissors, ShieldCheck, Square, SquarePen, Trash2} from "lucide-react";

interface TransactionsTableProps {
    transactions: TransactionsResponse;
    onDeleteClick: (transaction: Transaction) => void
    onEditClick: (transaction: Transaction) => void
    onVerifyClick: (transaction: Transaction) => void
    onSplitClick: (transaction: Transaction) => void
    verifyingTransactionId?: number
    selectedIds: Set<number>;
    onSelectionChange: (ids: Set<number>) => void;
    onVendorFilterClick?: (vendor: { id: number; name: string }) => void;
    onSubcategoryFilterClick?: (subcategoryId: number) => void;
    onTagFilterClick?: (tag: { id: number; name: string }) => void;
}


export function TransactionsTable({transactions, onEditClick, onDeleteClick, onVerifyClick, onSplitClick, verifyingTransactionId, selectedIds, onSelectionChange, onVendorFilterClick, onSubcategoryFilterClick, onTagFilterClick}: TransactionsTableProps) {
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
    <>
        {/* Mobile card layout (< sm) */}
        <div className="block lg:hidden border rounded-md">
            {transactions.transactions.length === 0 && (
                <Alert className="m-3" variant="default">
                    <AlertTitle>Nie znaleziono transakcji.</AlertTitle>
                </Alert>
            )}
            {transactions.transactions.map((t) => (
                <div
                    key={t.id}
                    className={`px-3 py-3 border-b last:border-b-0 border-l-4 ${t.isPossibleDuplicate ? "border-l-red-500" : !t.isVerified ? "border-l-amber-400" : "border-l-transparent"}`}
                    title={!t.isVerified && t.isPossibleDuplicate ? "Niezweryfikowana · Możliwy duplikat" : !t.isVerified ? "Niezweryfikowana" : t.isPossibleDuplicate ? "Możliwy duplikat" : undefined}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{format(new Date(t.transactionDate), dateFormat)}</span>
                        <Curr input={t.amount} colored isPositive={!t.isExpense} />
                    </div>
                    <div className="flex gap-2 items-end mt-1">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold">
                                {t.vendorId !== null && onVendorFilterClick
                                    ? <button className="hover:underline cursor-pointer text-left" onClick={() => onVendorFilterClick({ id: t.vendorId!, name: t.vendorName! })}>{t.vendorName}</button>
                                    : (t.vendorName ?? "-")}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                                {t.subcategoryId !== null && onSubcategoryFilterClick
                                    ? <button className="hover:underline cursor-pointer text-left" onClick={() => onSubcategoryFilterClick(t.subcategoryId!)}>{t.categoryName} / {t.subcategoryName}</button>
                                    : (t.categoryName && t.subcategoryName ? `${t.categoryName} / ${t.subcategoryName}` : "-")}
                            </div>
                            {t.description && (
                                <div className="text-sm mt-0.5 whitespace-pre-wrap">{t.description}</div>
                            )}
                            {t.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-1">
                                    {t.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary" className={`text-xs font-normal ${onTagFilterClick ? "cursor-pointer hover:underline" : ""}`}
                                               onClick={onTagFilterClick ? () => onTagFilterClick(tag) : undefined}>
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="shrink-0">
                            <ButtonGroup>
                                {!t.isVerified && t.vendorId !== null && t.subcategoryId !== null && (
                                    <Button
                                        variant="outline"
                                        className="hover:bg-green-100 hover:text-green-700 hover:border-green-400"
                                        onClick={() => onVerifyClick(t)}
                                        disabled={verifyingTransactionId === t.id}
                                        title="Zweryfikuj"
                                    >
                                        <ShieldCheck />
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => onEditClick(t)}><SquarePen /></Button>
                                <Button variant="outline" onClick={() => onSplitClick(t)} title="Podziel"><Scissors /></Button>
                                <Button variant="outline" className={"hover:bg-destructive hover:text-white"} onClick={() => onDeleteClick(t)}><Trash2 /></Button>
                                <Button
                                    variant={selectedIds.has(t.id) ? "default" : "outline"}
                                    onClick={() => handleSelectOne(t.id, !selectedIds.has(t.id))}
                                    title="Zaznacz"
                                >
                                    {selectedIds.has(t.id) ? <CheckSquare /> : <Square />}
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>
                </div>
            ))}
            {(transactions.summary.expensesCount > 0 || transactions.summary.incomesCount > 0) && (
                <div className="px-3 py-2 border-t">
                    {transactions.summary.expensesCount > 0 && (
                        <div className="flex justify-between py-1">
                            <span className="text-sm">Razem - wydatki ({transactions.summary.expensesCount})</span>
                            <Curr input={transactions.summary.expensesTotal} colored isPositive={false} />
                        </div>
                    )}
                    {transactions.summary.incomesCount > 0 && (
                        <div className="flex justify-between py-1">
                            <span className="text-sm">Razem - przychody ({transactions.summary.incomesCount})</span>
                            <Curr input={transactions.summary.incomesTotal} colored />
                        </div>
                    )}
                    {transactions.summary.expensesCount > 0 && transactions.summary.incomesCount > 0 && (
                        <div className="flex justify-between py-1 border-t">
                            <span className="text-sm">Bilans ({transactions.summary.expensesCount + transactions.summary.incomesCount})</span>
                            <Curr input={transactions.summary.balance} colored />
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Desktop table layout (≥ sm) */}
        <div className="hidden lg:block border rounded-md">
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
                            <TableCell className="whitespace-pre-wrap">
                                {t.subcategoryId !== null && onSubcategoryFilterClick
                                    ? <button className="hover:underline cursor-pointer text-left" onClick={() => onSubcategoryFilterClick(t.subcategoryId!)}>{t.categoryName} / {t.subcategoryName}</button>
                                    : (t.categoryName && t.subcategoryName ? `${t.categoryName} / ${t.subcategoryName}` : "-")}
                            </TableCell>
                            <TableCell className="whitespace-pre-wrap">
                                {t.vendorId !== null && onVendorFilterClick
                                    ? <button className="hover:underline cursor-pointer text-left" onClick={() => onVendorFilterClick({ id: t.vendorId!, name: t.vendorName! })}>{t.vendorName}</button>
                                    : (t.vendorName ?? "-")}
                            </TableCell>
                            <TableCell className="whitespace-pre-wrap">{t.description}</TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                    {t.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary" className={`text-xs font-normal ${onTagFilterClick ? "cursor-pointer hover:underline" : ""}`}
                                               onClick={onTagFilterClick ? () => onTagFilterClick(tag) : undefined}>
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
                                    {!t.isVerified && t.vendorId !== null && t.subcategoryId !== null && (
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
                                    <Button variant="outline" size="sm" onClick={() => onSplitClick(t)} title="Podziel"><Scissors /></Button>
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
    </>
    );
}
