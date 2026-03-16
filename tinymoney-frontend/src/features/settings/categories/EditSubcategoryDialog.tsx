import {useEffect} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {Category} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {toast} from "sonner"

interface EditSubcategoryDialogProps {
    isOpen: boolean
    subcategoryId: number
    currentName: string
    currentCategoryId: number
    categories: Category[]
    onClose: () => void
    onSaved: () => void
}

interface FormValues {
    name: string
    parentCategoryId: string
}

export function EditSubcategoryDialog({
    isOpen, subcategoryId, currentName, currentCategoryId, categories, onClose, onSaved
}: EditSubcategoryDialogProps) {
    const {categoriesClient} = useApiClient()

    const {register, handleSubmit, control, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: currentName, parentCategoryId: currentCategoryId.toString()}
    })

    useEffect(() => {
        if (isOpen) {
            reset({name: currentName, parentCategoryId: currentCategoryId.toString()})
        }
    }, [isOpen, currentName, currentCategoryId])

    const mutation = useMutation({
        mutationFn: (data: FormValues) =>
            categoriesClient.updateSubcategory(subcategoryId, currentCategoryId, data.name, Number(data.parentCategoryId)),
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
                    <DialogTitle>Edytuj podkategorię</DialogTitle>
                    <DialogDescription>Zmień nazwę lub przenieś do innej kategorii.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                    </div>
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
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
