import {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {addTag, editTag, type Tag} from "@/lib/api"

import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import {Input} from "@/components/ui/input.tsx";

interface TagEditorDialogProps {
    tagToEdit?: Tag,
    onClose?: () => void
}

export interface TagInputs {
    name: string
}

export function TagEditorDialog({tagToEdit, onClose}: TagEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const auth = useAuth0();

    useEffect(() => {
        setIsOpen(!!tagToEdit);
    }, [tagToEdit]);

    useEffect(() => {
        !isOpen && onClose && onClose();
    }, [isOpen]);


    const {register, handleSubmit, setValue, formState: {errors}, reset} = useForm<TagInputs>({
        defaultValues: {
            name: ""
        }
    })

    useEffect(() => {
        setIsOpen(!!tagToEdit);
        if (tagToEdit) {
            setValue("name", tagToEdit.name)
        } else {
            reset()
        }
    }, [tagToEdit]);

    const mutation = useMutation({
        mutationFn: (newTag: TagInputs) => tagToEdit
            ? editTag(tagToEdit.id, newTag, auth)
            : addTag(newTag, auth),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            queryClient.invalidateQueries({queryKey: ['tags']})
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: TagInputs) => {
        mutation.mutate(data)
    }
    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            reset();
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj Tag</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{tagToEdit ? "Edytuj tag" : "Dodaj nowy tag"}</DialogTitle>
                    <DialogDescription>
                        {tagToEdit ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane tagu i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa tagu</Label>
                        <Input {...register("name", { required: true })} />
                        {errors.name &&
                            <span className="text-red-500 text-xs">{errors.name.message}</span>}
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