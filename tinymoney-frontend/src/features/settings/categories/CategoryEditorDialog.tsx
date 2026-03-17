import {useEffect} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group"
import {toast} from "sonner"

interface CategoryEditorDialogProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    category?: { id: number; name: string }
}

interface FormValues {
    name: string
    type: "income" | "expense"
}

export function CategoryEditorDialog({isOpen, onClose, onSaved, category}: CategoryEditorDialogProps) {
    const {categoriesClient} = useApiClient()
    const isEditMode = category !== undefined

    const {register, handleSubmit, control, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: category?.name ?? "", type: "expense"}
    })

    useEffect(() => {
        if (isOpen) reset({name: category?.name ?? "", type: "expense"})
    }, [isOpen, category?.name])

    const mutation = useMutation({
        mutationFn: (data: FormValues) =>
            isEditMode
                ? categoriesClient.updateCategory(category.id, data.name)
                : categoriesClient.createCategory(data.name, data.type === "income"),
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
                    <DialogTitle>{isEditMode ? "Edytuj kategorię" : "Dodaj kategorię"}</DialogTitle>
                    {!isEditMode && <DialogDescription>Podaj nazwę i wybierz typ kategorii.</DialogDescription>}
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                            placeholder={isEditMode ? undefined : "Nazwa kategorii"}
                            autoFocus={isEditMode}
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                    </div>
                    {!isEditMode && (
                        <div className="grid gap-2">
                            <Label>Typ</Label>
                            <Controller
                                control={control}
                                name="type"
                                render={({field}) => (
                                    <ToggleGroup
                                        type="single"
                                        variant="outline"
                                        value={field.value}
                                        onValueChange={(v) => { if (v) field.onChange(v) }}
                                        className="w-full"
                                    >
                                        <ToggleGroupItem value="expense" className="flex-1">Wydatek</ToggleGroupItem>
                                        <ToggleGroupItem value="income" className="flex-1">Przychód</ToggleGroupItem>
                                    </ToggleGroup>
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
