import {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {type SavingsCategory} from "@/api/ApiTypes.ts"

import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {toast} from "sonner";
import {Input} from "@/components/ui/input.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface SavingsCategoryEditorDialogProps {
    categoryToEdit?: SavingsCategory,
    onClose?: () => void
}

interface CategoryInputs {
    name: string
}

export function SavingsCategoryEditorDialog({categoryToEdit, onClose}: SavingsCategoryEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const {savingsClient} = useApiClient();

    useEffect(() => {
        setIsOpen(!!categoryToEdit);
        if (categoryToEdit) {
            setValue("name", categoryToEdit.id > 0 ? categoryToEdit.name : "")
        } else {
            reset()
        }
    }, [categoryToEdit]);

    useEffect(() => {
        !isOpen && onClose && onClose();
    }, [isOpen]);

    const {register, handleSubmit, setValue, formState: {errors}, reset} = useForm<CategoryInputs>({
        defaultValues: {name: ""}
    })

    const mutation = useMutation<void, Error, CategoryInputs>({
        mutationFn: async (data: CategoryInputs) => {
            if (categoryToEdit && categoryToEdit.id > 0) {
                await savingsClient.updateCategory(categoryToEdit.id, data.name)
            } else {
                await savingsClient.createCategory(data.name)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-categories']})
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            reset();
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj kategorię</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{categoryToEdit && categoryToEdit.id > 0 ? "Edytuj kategorię" : "Dodaj kategorię"}</DialogTitle>
                    <DialogDescription>
                        {categoryToEdit && categoryToEdit.id > 0 ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane kategorii i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa kategorii</Label>
                        <Input {...register("name", {required: true, maxLength: 100})} />
                        {errors.name && <span className="text-red-500 text-xs">Nazwa jest wymagana</span>}
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
