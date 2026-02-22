import {useQuery} from "@tanstack/react-query"
import {getTags, type Tag} from "@/lib/api"
import {useAuth0} from "@auth0/auth0-react";
import {useState} from "react";
import {Link} from "react-router-dom";
import {Alert, AlertTitle} from "@/components/ui/alert.tsx";
import {Button} from "@/components/ui/button.tsx";
import {getTransactionsUrl, prepareTitleText} from "@/lib/utils.ts";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {TagRemovalDialog} from "@/features/tags/TagRemovalDialog.tsx";
import {TagEditorDialog} from "@/features/tags/TagEditorDialog.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";

export function TagsPage() {
    const auth = useAuth0();
    const [tagToRemove, setTagToRemove] = useState<Tag | undefined>(undefined)
    const [tagToEdit, setTagToEdit] = useState<Tag | undefined>(undefined)
    const [tagsWithoutTransactionsFilter, setTagsWithoutTransactionsFilter] = useState(false);

    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => getTags(auth)
    })
    return (
        <div className="max-w-7xl mx-auto">
            <title>{prepareTitleText("Tagi")}</title>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tagi</h1>
                <TagEditorDialog tagToEdit={tagToEdit} onClose={() => setTagToEdit(undefined)} />
                <TagRemovalDialog tagToRemove={tagToRemove}/>
            </div>
            <div className="flex flex-row gap-3 mb-6">
                <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" size="sm" checked={tagsWithoutTransactionsFilter} onCheckedChange={setTagsWithoutTransactionsFilter} />
                    <Label htmlFor="airplane-mode">Tagi bez transakcji</Label>
                </div>
            </div>

            {tagsWithoutTransactionsFilter}
            {tagsQuery.isLoading &&
                <div className="p-10">Ładowanie danych...</div>}
            {tagsQuery.isError &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {tagsQuery.data &&
                <div className="border rounded-md">
                    <Table className={"table-auto"}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tagsQuery.data.length == 0 &&
                                <TableRow>
                                    <TableCell colSpan={7} className={"text-center"}>
                                        <Alert className="mb-6" variant="default">
                                            <AlertTitle>Nie znaleziono tagów.</AlertTitle>
                                        </Alert>
                                    </TableCell>
                                </TableRow> }
                            {tagsQuery.data.filter(t => !tagsWithoutTransactionsFilter || t.numberOfTransactions == 0).map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        {t.name}
                                    </TableCell>
                                    <TableCell className={"flex justify-end"}>
                                        <ButtonGroup>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={getTransactionsUrl({tagId: t.id})} target={"_blank"}>
                                                    Transakcje ({t.numberOfTransactions})</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setTagToEdit(t)}>Edytuj</Button>
                                            <Button variant="outline" className={"hover:bg-destructive hover:text-white"} size="sm" onClick={() => setTagToRemove(t)}>Usuń</Button>
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