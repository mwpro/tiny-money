import {useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {Category} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Trash2} from "lucide-react"
import {toast} from "sonner"
import {SubcategoryRow} from "@/features/settings/categories/SubcategoryRow.tsx"
import {AddSubcategoryDialog} from "@/features/settings/categories/AddSubcategoryDialog.tsx"
import {EditCategoryDialog} from "@/features/settings/categories/EditCategoryDialog.tsx"

interface CategoryRowProps {
    category: Category
    allCategories: Category[]
    isFirst: boolean
    isLast: boolean
    showDeleted: boolean
    onMutated: () => void
}

export function CategoryRow({category, allCategories, isFirst, isLast, showDeleted, onMutated}: CategoryRowProps) {
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

    const visibleSubcategories = showDeleted
        ? category.subcategories
        : category.subcategories.filter(s => !s.isDeleted)

    const activeSubcategories = category.subcategories.filter(s => !s.isDeleted)

    return (
        <div className={`border rounded-md mb-2 ${category.isDeleted ? "opacity-50" : ""}`}>
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

                {!category.isDeleted && (
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Usuń kategorię</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Kategoria „{category.name}" zostanie usunięta. Istniejące transakcje i podkategorie nie zostaną usunięte.
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
                )}
                {category.isDeleted && (
                    <span className="text-xs text-muted-foreground italic">archiwalna</span>
                )}
            </div>

            {!collapsed && (
                <div className="border-t">
                    {visibleSubcategories.map((sub, idx) => (
                        <SubcategoryRow
                            key={sub.id}
                            subcategory={sub}
                            categoryId={category.id}
                            isFirst={idx === 0}
                            isLast={idx === activeSubcategories.length - 1}
                            categories={allCategories}
                            onMutated={onMutated}
                        />
                    ))}
                </div>
            )}

            <EditCategoryDialog
                isOpen={editOpen}
                categoryId={category.id}
                currentName={category.name}
                onClose={() => setEditOpen(false)}
                onSaved={onMutated}
            />
            <AddSubcategoryDialog
                isOpen={addSubcategoryOpen}
                categoryId={category.id}
                categoryName={category.name}
                onClose={() => setAddSubcategoryOpen(false)}
                onCreated={onMutated}
            />
        </div>
    )
}
