import {useEffect, useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useNavigate} from "react-router-dom"
import type {PlanDetail, PlanSummary} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input.tsx"
import {Textarea} from "@/components/ui/textarea.tsx"
import {DatePicker} from "@/components/DatePicker.tsx"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface PlanEditorDialogProps {
    planToEdit?: PlanDetail | PlanSummary;
    onClose?: () => void;
    trigger?: React.ReactNode;
}

interface PlanFormInputs {
    title: string;
    description: string;
    dateFrom: string;
    dateTo: string;
}

export function PlanEditorDialog({planToEdit, onClose, trigger}: PlanEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const {plansClient} = useApiClient()

    useEffect(() => {
        if (planToEdit) setIsOpen(true);
    }, [planToEdit]);

    useEffect(() => {
        if (!isOpen) onClose?.();
    }, [isOpen]);

    const {register, control, handleSubmit, setValue, formState: {errors}, reset} = useForm<PlanFormInputs>({
        defaultValues: {title: "", description: "", dateFrom: "", dateTo: ""}
    })

    useEffect(() => {
        if (planToEdit) {
            setValue("title", planToEdit.title)
            setValue("description", planToEdit.description ?? "")
            setValue("dateFrom", planToEdit.dateFrom.substring(0, 10))
            setValue("dateTo", planToEdit.dateTo?.substring(0, 10) ?? "")
        } else {
            reset()
        }
    }, [planToEdit]);

    const mutation = useMutation({
        mutationFn: async (data: PlanFormInputs) => {
            const req = {
                title: data.title,
                description: data.description || undefined,
                dateFrom: data.dateFrom,
                dateTo: data.dateTo || undefined,
            };
            if (planToEdit) {
                await plansClient.updatePlan(planToEdit.id, req);
                return null;
            } else {
                const plan = await plansClient.createPlan(req);
                return plan.id;
            }
        },
        onSuccess: (newPlanId) => {
            queryClient.invalidateQueries({queryKey: ['plans']})
            queryClient.invalidateQueries({queryKey: ['dashboard']})
            reset()
            setIsOpen(false)
            if (newPlanId) navigate(`/plans/${newPlanId}`)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            if (!v) reset();
        }}>
            <DialogTrigger asChild>
                {trigger ?? <Button>Nowy plan</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{planToEdit ? "Edytuj plan" : "Nowy plan"}</DialogTitle>
                    <DialogDescription>
                        {planToEdit ? "Zmień szczegóły planu i kliknij Zapisz" : "Uzupełnij dane planu i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input {...register("title", {required: true})} />
                        {errors.title && <span className="text-destructive text-xs">Nazwa jest wymagana</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Opis (opcjonalnie)</Label>
                        <Textarea {...register("description")} rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Data od</Label>
                            <Controller control={control} name="dateFrom" rules={{required: true}} render={({field}) => (
                                <DatePicker value={field.value} ref={field.ref} onChange={field.onChange} placeholder="Data od"/>
                            )}/>
                            <div className="min-h-[1.25rem]">
                                {errors.dateFrom && <span className="text-destructive text-xs">Wymagane</span>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data do (opcjonalnie)</Label>
                            <Controller control={control} name="dateTo" render={({field}) => (
                                <DatePicker value={field.value} ref={field.ref} onChange={field.onChange} placeholder="Data do"/>
                            )}/>
                            <div className="min-h-[1.25rem]"/>
                        </div>
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
