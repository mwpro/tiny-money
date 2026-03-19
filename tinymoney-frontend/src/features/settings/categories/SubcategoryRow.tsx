import {useState} from "react"
import {Link} from "react-router-dom"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {DetailedCategory, DetailedSubcategory} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {ChevronDown, ChevronUp, List, Pencil, Store, Trash2} from "lucide-react"
import {toast} from "sonner"
import {getTransactionsUrl} from "@/lib/utils.ts"
import {SubcategoryEditorDialog} from "@/features/settings/categories/SubcategoryEditorDialog.tsx"

interface SubcategoryRowProps {
    subcategory: DetailedSubcategory
    categoryId: number
    isFirst: boolean
    isLast: boolean
    categories: DetailedCategory[]
    onMutated: () => void
}

export function SubcategoryRow({subcategory, categoryId, isFirst, isLast, categories, onMutated}: SubcategoryRowProps) {
    const {categoriesClient} = useApiClient()
    const [editOpen, setEditOpen] = useState(false)

    const moveUpMutation = useMutation({
        mutationFn: () => categoriesClient.moveSubcategoryUp(categoryId, subcategory.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    const moveDownMutation = useMutation({
        mutationFn: () => categoriesClient.moveSubcategoryDown(categoryId, subcategory.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: () => categoriesClient.deleteSubcategory(categoryId, subcategory.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    return (
        <div className="flex items-center justify-between py-1.5 pl-8 pr-2">
            <span className="text-sm">{subcategory.name}</span>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Transakcje" asChild>
                    <Link to={getTransactionsUrl({subcategoryId: subcategory.id})} target="_blank">
                        <List className="h-3.5 w-3.5" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Sprzedawcy" asChild>
                    <Link to={`/vendors?subcategoryId=${subcategory.id}`} target="_blank">
                        <Store className="h-3.5 w-3.5" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isFirst || moveUpMutation.isPending} onClick={() => moveUpMutation.mutate()}>
                    <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLast || moveDownMutation.isPending} onClick={() => moveDownMutation.mutate()}>
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={subcategory.hasUsages}
                            title={subcategory.hasUsages ? "Przenieś transakcje i sprzedawców przed usunięciem" : undefined}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Usuń podkategorię</AlertDialogTitle>
                            <AlertDialogDescription>
                                Podkategoria „{subcategory.name}" zostanie <strong>trwale usunięta</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate()}
                            >
                                Usuń
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <SubcategoryEditorDialog
                isOpen={editOpen}
                subcategory={{id: subcategory.id, name: subcategory.name, categoryId}}
                categories={categories}
                onClose={() => setEditOpen(false)}
                onSaved={onMutated}
            />
        </div>
    )
}
