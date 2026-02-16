import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Curr} from "@/components/Curr.tsx";
import type {TopTransaction} from "@/lib/api.ts";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Link} from "react-router-dom";
import {ListIcon} from "lucide-react";
import {getTransactionsUrl} from "@/lib/utils.ts";
import {format} from "date-fns";

interface BudgetTableProps {
    transactions: TopTransaction[],
    incomes: boolean
}

export function TopTransactionsTable({transactions, incomes}: BudgetTableProps) {
    return (
        <div className="border rounded-md flex-1">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Sprzedawca</TableHead>
                        <TableHead className="text-right">Kwota</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length == 0 &&
                        <TableRow>
                            <TableCell colSpan={5} className={"text-center"}>
                                <Alert className="mb-6" variant="default">
                                    <AlertTitle>Nie znaleziono transakcji.</AlertTitle>
                                </Alert>
                            </TableCell>
                        </TableRow> }
                    {transactions.map((t, id) => <TableRow key={t.id}>
                        <TableCell>{++id}.</TableCell>
                        <TableCell>{format(new Date(t.transactionDate), "yyyy-MM-dd")}</TableCell>
                        <TableCell>{t.vendorName}</TableCell>
                        <TableCell className="text-right"><Curr input={t.amount} colored isPositive={incomes}/></TableCell>
                        <TableCell>
                            <Link to={getTransactionsUrl({ dateFrom: new Date(t.transactionDate), dateTo: new Date(t.transactionDate), vendorId: t.vendorId, isExpense: !incomes })} target={"_blank"}>
                                <ListIcon className="inline pr-1" size={19} />
                            </Link>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div>
    );
}