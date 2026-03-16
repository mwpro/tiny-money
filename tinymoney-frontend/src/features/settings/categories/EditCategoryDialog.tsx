import {useEffect} from "react"
import {useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {toast} from "sonner"

interface EditCategoryDialogProps {
    isOpen: boolean
    categoryId: number
    currentName: string
    onClose: () => void
    onSaved: () => void
}

interface FormValues {
    name: string
}

export function EditCategoryDialog({isOpen, categoryId, currentName, onClose, onSaved}: EditCategoryDialogProps) {
    const {categoriesClient} = useApiClient()

    const {register, handleSubmit, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: currentName}
    })

    useEffect(() => {
        if (isOpen) reset({name: currentName})
    }, [isOpen, currentName])

    const mutation = useMutation({
        mutationFn: (data: FormValues) => categoriesClient.updateCategory(categoryId, data.name),
        onSuccess: () => {
            onClose()
            onSaved()
        },
        onError: (e) => toast.error("Błąd: " + e.message)
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edytuj kategorię</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                            autoFocus
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
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
