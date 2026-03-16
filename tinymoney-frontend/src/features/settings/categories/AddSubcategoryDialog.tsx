import {useEffect} from "react"
import {useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {toast} from "sonner"

interface AddSubcategoryDialogProps {
    isOpen: boolean
    categoryId: number
    categoryName: string
    onClose: () => void
    onCreated: () => void
}

interface FormValues {
    name: string
}

export function AddSubcategoryDialog({isOpen, categoryId, categoryName, onClose, onCreated}: AddSubcategoryDialogProps) {
    const {categoriesClient} = useApiClient()

    const {register, handleSubmit, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: ""}
    })

    useEffect(() => {
        if (!isOpen) reset()
    }, [isOpen])

    const mutation = useMutation({
        mutationFn: (data: FormValues) => categoriesClient.createSubcategory(categoryId, data.name),
        onSuccess: () => {
            onClose()
            onCreated()
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Dodaj podkategorię</DialogTitle>
                    <DialogDescription>
                        Nowa podkategoria w kategorii „{categoryName}".
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                            placeholder="Nazwa podkategorii"
                            autoFocus
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Dodawanie..." : "Dodaj"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
