import {useState} from "react"
import {useQuery, useQueryClient} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {CategoryRow} from "@/features/settings/categories/CategoryRow.tsx"
import {CategoryEditorDialog} from "@/features/settings/categories/CategoryEditorDialog.tsx"
import {Button} from "@/components/ui/button"

export function CategoriesSettingsSection() {
    const {categoriesClient} = useApiClient()
    const queryClient = useQueryClient()
    const [showDeleted, setShowDeleted] = useState(false)
    const [addOpen, setAddOpen] = useState(false)

    const categoriesQuery = useQuery({
        queryKey: ['categories', 'detailed'],
        queryFn: () => categoriesClient.getCategoriesDetailed()
    })

    const invalidate = () => queryClient.invalidateQueries({queryKey: ['categories', 'detailed']})

    const categories = categoriesQuery.data ?? []
    const visibleCategories = showDeleted ? categories : categories.filter(c => !c.isDeleted)
    const activeCategories = categories.filter(c => !c.isDeleted)

    return (
        <section>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-lg font-medium">Kategorie</h2>
                    <p className="text-sm text-muted-foreground">Zarządzaj kategoriami i podkategoriami transakcji.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>+ Dodaj kategorię</Button>
                <CategoryEditorDialog isOpen={addOpen} onClose={() => setAddOpen(false)} onSaved={invalidate} />
            </div>

            {categoriesQuery.isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
            {categoriesQuery.isError && <p className="text-sm text-destructive">Błąd ładowania kategorii.</p>}

            {categoriesQuery.data && (
                <>
                    <div className="mb-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground text-xs"
                            onClick={() => setShowDeleted(v => !v)}
                        >
                            {showDeleted ? "Ukryj archiwalne" : "Pokaż archiwalne"}
                        </Button>
                    </div>

                    {visibleCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">Brak kategorii.</p>
                    )}

                    {visibleCategories.map((category, idx) => (
                        <CategoryRow
                            key={category.id}
                            category={category}
                            allCategories={categories}
                            isFirst={idx === 0}
                            isLast={idx === activeCategories.length - 1}
                            showDeleted={showDeleted}
                            onMutated={invalidate}
                        />
                    ))}
                </>
            )}
        </section>
    )
}
