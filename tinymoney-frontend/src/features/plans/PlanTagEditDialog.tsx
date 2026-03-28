import {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import type {PlanTagLine} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input.tsx"
import {Textarea} from "@/components/ui/textarea.tsx"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface PlanTagEditDialogProps {
    planId: number;
    tagLine?: PlanTagLine;
    onClose: () => void;
}

interface FormInputs {
    amount: number;
    description: string;
}

export function PlanTagEditDialog({planId, tagLine, onClose}: PlanTagEditDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const {plansClient} = useApiClient()

    useEffect(() => {
        setIsOpen(!!tagLine)
        if (tagLine) {
            setValue("amount", tagLine.amount)
            setValue("description", tagLine.description ?? "")
        }
    }, [tagLine]);

    useEffect(() => {
        if (!isOpen) onClose()
    }, [isOpen]);

    const {register, handleSubmit, setValue, formState: {errors}} = useForm<FormInputs>()

    const mutation = useMutation({
        mutationFn: (data: FormInputs) =>
            plansClient.updatePlanTag(planId, tagLine!.tagId, {
                amount: Number(data.amount),
                description: data.description || undefined
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['plans', planId]})
            setIsOpen(false)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[400px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Edytuj pozycję — {tagLine?.tagName}</DialogTitle>
                    <DialogDescription>Zmień kwotę lub opis pozycji.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Kwota budżetu</Label>
                        <Input
                            type="number"
                            step="0.01"
                            {...register("amount", {required: true, min: 0.01})}
                        />
                        {errors.amount && <span className="text-destructive text-xs">Podaj kwotę większą niż 0</span>}
                    </div>
                    <div className="grid gap-2">
                        <Label>Opis (opcjonalnie)</Label>
                        <Textarea {...register("description")} rows={2}/>
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
