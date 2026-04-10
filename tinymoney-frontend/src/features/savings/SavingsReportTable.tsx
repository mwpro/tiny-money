import {Fragment, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Curr, formatCurrencyAsString} from "@/components/Curr.tsx";
import type {SavingsTableData, SavingsTablePeriodData} from "@/api/ApiTypes.ts";

function RoiCell({netGain, roi, deposited, withdrawn, balance}: {
    netGain: number;
    roi: number | null;
    deposited: number;
    withdrawn: number;
    balance: number;
}) {
    const colorClass = roi === null
        ? "text-muted-foreground"
        : roi >= 0 ? "text-income" : "text-expense";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`font-mono tabular-nums cursor-default ${colorClass}`}>
                    {roi === null
                        ? "—"
                        : `${formatCurrencyAsString(netGain)} (${roi.toFixed(2)}%)`}
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono grid gap-1">
                <p>Wpłaty: <Curr input={deposited}/></p>
                <p>Wypłaty: <Curr input={withdrawn}/></p>
                <p>Saldo: <Curr input={balance}/></p>
            </TooltipContent>
        </Tooltip>
    );
}

function SummaryRoiCell({row}: {
    row: { totalNetGain: number; totalRoi: number | null; totalDeposited: number; totalWithdrawn: number; currentBalance: number }
}) {
    return (
        <RoiCell
            netGain={row.totalNetGain}
            roi={row.totalRoi}
            deposited={row.totalDeposited}
            withdrawn={row.totalWithdrawn}
            balance={row.currentBalance}
        />
    );
}

function PeriodCell({pd}: { pd: SavingsTablePeriodData | null }) {
    if (pd === null) {
        return <TableCell className="text-right text-muted-foreground">—</TableCell>;
    }
    return (
        <TableCell className="text-right">
            <RoiCell netGain={pd.netGain} roi={pd.roi} deposited={pd.deposited} withdrawn={pd.withdrawn} balance={pd.balance}/>
        </TableCell>
    );
}

export function SavingsReportTable({tableData}: { tableData: SavingsTableData }) {
    const [expandedCategory, setExpandedCategory] = useState<number | undefined>(undefined);

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Zestawienie kont</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                {tableData.periods.map(year => (
                                    <TableHead key={year} className="text-right">{year}</TableHead>
                                ))}
                                <TableHead className="text-right">Łącznie</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.categories.map(category => (
                                <Fragment key={category.categoryId}>
                                    <TableRow className="bg-muted">
                                        <TableCell
                                            className="font-bold cursor-pointer"
                                            onClick={() => setExpandedCategory(prev =>
                                                prev !== category.categoryId ? category.categoryId : undefined
                                            )}
                                        >
                                            {category.categoryName}
                                        </TableCell>
                                        {category.periodData.map((pd, i) => (
                                            <PeriodCell key={tableData.periods[i]} pd={pd}/>
                                        ))}
                                        <TableCell className="text-right">
                                            <SummaryRoiCell row={category}/>
                                        </TableCell>
                                    </TableRow>
                                    {expandedCategory === category.categoryId && category.accounts.map(account => (
                                        <TableRow key={account.accountId}>
                                            <TableCell className="pl-6">{account.accountName}</TableCell>
                                            {account.periodData.map((pd, i) => (
                                                <PeriodCell key={tableData.periods[i]} pd={pd}/>
                                            ))}
                                            <TableCell className="text-right">
                                                <SummaryRoiCell row={account}/>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Fragment>
                            ))}
                            <TableRow className="bg-muted font-bold">
                                <TableCell className="font-bold">Łącznie</TableCell>
                                {tableData.totals.periodData.map(pd => (
                                    <TableCell key={pd.period} className="text-right">
                                        <RoiCell netGain={pd.netGain} roi={pd.roi} deposited={pd.deposited} withdrawn={pd.withdrawn} balance={pd.balance}/>
                                    </TableCell>
                                ))}
                                <TableCell className="text-right">
                                    <SummaryRoiCell row={tableData.totals}/>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
