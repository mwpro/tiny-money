import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import type {Budget, Category} from "@/lib/api.ts";
import {Fragment} from "react";

interface TransactionsTableProps {
    categories: Category[],
    budget: Budget
}


export function BudgetTable({categories, budget}: TransactionsTableProps) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead className={`text-right`}>Plan</TableHead>
                        <TableHead className={`text-right`}>Realizacja</TableHead>
                        <TableHead className={`text-right`}>Różnica</TableHead>
                        <TableHead>Notatki</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <Fragment key={category.id}>
                            <TableRow className={"font-bold"}>
                                <TableCell>{category.name}</TableCell>
                            </TableRow>
                            {category.subcategories.map(subcategory => {
                                const budgetForSubcategory = budget.budgetEntries.find(b => b.subcategoryId === subcategory.id) || {
                                    subcategoryId: subcategory.id,
                                    amount: 0,
                                    usedAmount: 0,
                                    notes: undefined
                                };
                                const budgetRealization = budgetForSubcategory.amount - budgetForSubcategory.usedAmount;
                                                               
                                return (
                                    <TableRow key={`${category.id}-${subcategory.id}`}>
                                        <TableCell>{subcategory.name}</TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(budgetForSubcategory.amount)}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(budgetForSubcategory.usedAmount)}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${budgetForSubcategory.amount && ((budgetRealization >= 0) ? "text-green-600" : "text-red-600")}`}>
                                            {new Intl.NumberFormat('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }).format(budgetRealization)}
                                        </TableCell>
                                        <TableCell>{budgetForSubcategory.notes}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </Fragment>
                    ))}
                    {/*{transactions.map((t) => (*/}
                    {/*    <TableRow key={t.id}>*/}
                    {/*        <TableCell className="w-[120px]">*/}
                    {/*            {new Date(t.transactionDate).toLocaleDateString('pl-PL')}*/}
                    {/*        </TableCell>*/}
                    {/*        <TableCell>{getSubcategoryName(t.subcategoryId)}</TableCell>*/}
                    {/*        <TableCell>{getVendorName(t.vendorId)}</TableCell>*/}
                    {/*        <TableCell className="font-medium">{t.description}</TableCell>*/}
                    {/*        <TableCell>*/}
                    {/*            <div className="flex gap-1 flex-wrap">*/}
                    {/*                {getTagNames(t.tagIds).map((tag) => (*/}
                    {/*                    <Badge key={tag.id} variant="secondary" className="text-xs font-normal">*/}
                    {/*                        {tag.name}*/}
                    {/*                    </Badge>*/}
                    {/*                ))}*/}
                    {/*            </div>*/}
                    {/*        </TableCell>*/}
                    {/*        <TableCell*/}
                    {/*            className={`text-right font-mono ${t.isExpense ? "text-red-600" : "text-green-600"}`}>*/}
                    {/*            {new Intl.NumberFormat('pl-PL', {*/}
                    {/*                style: 'currency',*/}
                    {/*                currency: 'PLN'*/}
                    {/*            }).format(t.amount)}*/}
                    {/*        </TableCell>*/}
                    {/*        <TableCell>*/}
                    {/*            <ButtonGroup>*/}
                    {/*                <Button variant="outline" onClick={() => onEditClick(t)}*/}
                    {/*                >Edytuj</Button>*/}
                    {/*                <DropdownMenu>*/}
                    {/*                   <DropdownMenuTrigger asChild>*/}
                    {/*                        <Button variant="outline" size="icon" aria-label="More Options">*/}
                    {/*                            ...*/}
                    {/*                        </Button>*/}
                    {/*                    </DropdownMenuTrigger>*/}
                    {/*                    <DropdownMenuContent align="end" className="w-52">*/}
                    {/*                        <DropdownMenuGroup>*/}
                    {/*                            <DropdownMenuItem variant="destructive" onClick={() => onDeleteClick(t)}>*/}
                    {/*                                Usuń*/}
                    {/*                            </DropdownMenuItem>*/}
                    {/*                        </DropdownMenuGroup>*/}
                    {/*                    </DropdownMenuContent>*/}
                    {/*                </DropdownMenu>*/}
                    {/*            </ButtonGroup>*/}
                    {/*        </TableCell>*/}
                    {/*    </TableRow>*/}
                    {/*))}*/}
                </TableBody>
            </Table>
        </div>
    );
}