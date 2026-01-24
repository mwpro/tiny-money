import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import type {Subcategories, Tag, Transaction, Vendor} from "@/lib/api.ts";
import {Curr} from "@/components/Curr.tsx";

interface TransactionsTableProps {
    transactions: Transaction[];
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
                {transactions.map((t) => (
                    <TableRow key={t.id}>
                        <TableCell className="w-[120px]">
                            {new Date(t.transactionDate).toLocaleDateString('pl-PL')}
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
                        <TableCell>
                            <Curr input={t.amount} colored isPositive={!t.isExpense} />
                        </TableCell>
                        <TableCell>
                            <ButtonGroup>
                                <Button variant="outline" onClick={() => onEditClick(t)}
                                >Edytuj</Button>
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" aria-label="More Options">
                                            ...
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
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
        </Table>
    </div>
    );
}