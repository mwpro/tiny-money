import {useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {DetailedCategory} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Trash2} from "lucide-react"
import {toast} from "sonner"
import {SubcategoryRow} from "@/features/settings/categories/SubcategoryRow.tsx"
import {CategoryEditorDialog} from "@/features/settings/categories/CategoryEditorDialog.tsx"
import {SubcategoryEditorDialog} from "@/features/settings/categories/SubcategoryEditorDialog.tsx"

interface CategoryRowProps {
    category: DetailedCategory
    allCategories: DetailedCategory[]
    isFirst: boolean
    isLast: boolean
    onMutated: () => void
}

export function CategoryRow({category, allCategories, isFirst, isLast, onMutated}: CategoryRowProps) {
    const {categoriesClient} = useApiClient()
    const [collapsed, setCollapsed] = useState(true)
    const [editOpen, setEditOpen] = useState(false)
    const [addSubcategoryOpen, setAddSubcategoryOpen] = useState(false)

    const moveUpMutation = useMutation({
        mutationFn: () => categoriesClient.moveCategoryUp(category.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    const moveDownMutation = useMutation({
        mutationFn: () => categoriesClient.moveCategoryDown(category.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: () => categoriesClient.deleteCategory(category.id),
        onSuccess: onMutated,
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    const hasSubcategories = category.subcategories.length > 0

    return (
        <div className="border rounded-md mb-2">
            <div className="flex items-center gap-2 px-3 py-2">
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setCollapsed(v => !v)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <span className="flex-1 font-medium text-sm">
                    {category.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({category.isIncome ? "przychód" : "wydatek"})
                    </span>
                </span>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Dodaj podkategorię" onClick={() => setAddSubcategoryOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={hasSubcategories}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Usuń kategorię</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Kategoria „{category.name}" zostanie <strong>trwale usunięta</strong>.
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
            </div>

            {!collapsed && (
                <div className="border-t">
                    {category.subcategories.map((sub, idx) => (
                        <SubcategoryRow
                            key={sub.id}
                            subcategory={sub}
                            categoryId={category.id}
                            isFirst={idx === 0}
                            isLast={idx === category.subcategories.length - 1}
                            categories={allCategories}
                            onMutated={onMutated}
                        />
                    ))}
                </div>
            )}

            <CategoryEditorDialog
                isOpen={editOpen}
                category={{id: category.id, name: category.name}}
                onClose={() => setEditOpen(false)}
                onSaved={onMutated}
            />
            <SubcategoryEditorDialog
                isOpen={addSubcategoryOpen}
                categoryId={category.id}
                categoryName={category.name}
                categories={allCategories}
                onClose={() => setAddSubcategoryOpen(false)}
                onSaved={onMutated}
            />
        </div>
    )
}
