import {useEffect} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {DetailedCategory} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {toast} from "sonner"

interface SubcategoryEditorDialogProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    categories: DetailedCategory[]
    categoryId?: number
    categoryName?: string
    subcategory?: { id: number; name: string; categoryId: number }
}

interface FormValues {
    name: string
    parentCategoryId: string
}

export function SubcategoryEditorDialog({
    isOpen, onClose, onSaved, categories, categoryId, categoryName, subcategory
}: SubcategoryEditorDialogProps) {
    const {categoriesClient} = useApiClient()
    const isEditMode = subcategory !== undefined

    const defaultParentId = isEditMode ? subcategory.categoryId : (categoryId ?? 0)

    const {register, handleSubmit, control, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: subcategory?.name ?? "", parentCategoryId: defaultParentId.toString()}
    })

    useEffect(() => {
        if (isOpen) {
            reset({
                name: subcategory?.name ?? "",
                parentCategoryId: defaultParentId.toString()
            })
        }
    }, [isOpen, subcategory?.name, subcategory?.categoryId, categoryId])

    const mutation = useMutation({
        mutationFn: (data: FormValues) =>
            isEditMode
                ? categoriesClient.updateSubcategory(subcategory.id, subcategory.categoryId, data.name, Number(data.parentCategoryId))
                : categoriesClient.createSubcategory(categoryId!, data.name),
        onSuccess: () => {
            onClose()
            onSaved()
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edytuj podkategorię" : "Dodaj podkategorię"}</DialogTitle>
                    {!isEditMode && categoryName && (
                        <DialogDescription>Nowa podkategoria w kategorii „{categoryName}".</DialogDescription>
                    )}
                    {isEditMode && (
                        <DialogDescription>Zmień nazwę lub przenieś do innej kategorii.</DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                            placeholder={isEditMode ? undefined : "Nazwa podkategorii"}
                            autoFocus
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                    </div>
                    {isEditMode && (
                        <div className="grid gap-2">
                            <Label>Kategoria nadrzędna</Label>
                            <Controller
                                control={control}
                                name="parentCategoryId"
                                render={({field}) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wybierz kategorię" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.filter(c => !c.isDeleted).map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending
                                ? (isEditMode ? "Zapisywanie..." : "Dodawanie...")
                                : (isEditMode ? "Zapisz" : "Dodaj")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
