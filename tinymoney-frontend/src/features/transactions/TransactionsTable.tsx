import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import type {Subcategories, Tag, Transaction, TransactionsResponse, Vendor} from "@/lib/api.ts";
import {Curr} from "@/components/Curr.tsx";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {format} from "date-fns";
import {dateFormat} from "@/lib/utils.ts";

interface TransactionsTableProps {
    transactions: TransactionsResponse;
    vendors: Vendor[];
    subcategories: Subcategories,
    tags: Tag[],
    onDeleteClick: (transaction: Transaction) => void
    onEditClick: (transaction: Transaction) => void
}


export function TransactionsTable({transactions, vendors, subcategories, tags, onEditClick, onDeleteClick}: TransactionsTableProps) {
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
    
    return ( 
    <div className="border rounded-md">
        <Table>
            <TableHeader>
                <TableRow>
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
                        <TableCell colSpan={7} className={"text-center"}>
                            <Alert className="mb-6" variant="default">
                                <AlertTitle>Nie znaleziono transakcji.</AlertTitle>
                            </Alert>
                        </TableCell>
                    </TableRow> }
                {transactions.transactions.map((t) => (
                    <TableRow key={t.id}>
                        <TableCell>
                            {format(new Date(t.transactionDate), dateFormat)}
                        </TableCell>
                        <TableCell>{getSubcategoryName(t.subcategoryId)}</TableCell>
                        <TableCell>{getVendorName(t.vendorId)}</TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
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
                                <Button variant="outline" size="sm" onClick={() => onEditClick(t)}
                                >Edytuj</Button>
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon-sm" aria-label="More Options">
                                            ...
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem variant="destructive" onClick={() => onDeleteClick(t)}>
                                                Usuń
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                {transactions.summary.expensesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={5}>Razem - wydatki ({transactions.summary.expensesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.expensesTotal} colored isPositive={false} /></TableCell>
                    <TableCell />
                </TableRow>}
                {transactions.summary.incomesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={5}>Razem - przychody ({transactions.summary.incomesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.incomesTotal} colored /></TableCell>
                    <TableCell />
                </TableRow>}
                {transactions.summary.expensesCount > 0 && transactions.summary.incomesCount > 0 && <TableRow>
                    <TableCell className="text-right" colSpan={5}>Bilans ({transactions.summary.expensesCount + transactions.summary.incomesCount})</TableCell>
                    <TableCell className="text-right"><Curr input={transactions.summary.balance} colored /></TableCell>
                    <TableCell />
                </TableRow>}
            </TableFooter>
        </Table>
    </div>
    );
}