import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Curr} from "@/components/Curr.tsx";
import type {TopEntry} from "@/api/ApiTypes.ts";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Link} from "react-router-dom";
import {ListIcon} from "lucide-react";
import type {ReportSettings} from "@/features/reports/toplist-report/TopListReportPage.tsx";
import {getTransactionsUrl, type TransactionsUrlParams} from "@/lib/utils.ts";

interface BudgetTableProps {
    entries: TopEntry[],
    incomes: boolean,
    reportSettings: ReportSettings
    transactionsUrlConfigurer: (entry: TopEntry) => TransactionsUrlParams
}

export function TopEntriesTable({entries, incomes, reportSettings, transactionsUrlConfigurer}: BudgetTableProps) {
    return (
        <div className="border rounded-md flex-1 [&_td]:whitespace-normal">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Nazwa</TableHead>
                        <TableHead className="text-right">Suma</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries?.length == 0 &&
                        <TableRow>
                            <TableCell colSpan={5} className={"text-center"}>
                                <Alert className="mb-6" variant="default">
                                    <AlertTitle>Nie znaleziono transakcji.</AlertTitle>
                                </Alert>
                            </TableCell>
                        </TableRow>}
                    {entries?.map((t, id) => <TableRow key={t.id}>
                        <TableCell>{++id}.</TableCell>
                        <TableCell>{t.description} ({t.numberOfTransactions})</TableCell>
                        <TableCell className="text-right"><Curr input={t.amount} colored
                                                                isPositive={incomes}/></TableCell>
                        <TableCell>
                            <Link to={getTransactionsUrl({ ...transactionsUrlConfigurer(t), dateFrom: reportSettings.dateFrom && reportSettings.dateFrom, dateTo: reportSettings.dateTo && reportSettings.dateTo, isExpense: !incomes })} target={"_blank"}>
                                <ListIcon className="inline pr-1" size={19}/>
                            </Link>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div>
    );
}