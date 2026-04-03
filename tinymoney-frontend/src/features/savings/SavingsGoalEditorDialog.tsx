import {useEffect, useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {type SavingsGoal} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input.tsx"
import {Checkbox} from "@/components/ui/checkbox.tsx"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface SavingsGoalEditorDialogProps {
    goalToEdit?: SavingsGoal
    onClose?: () => void
}

interface GoalInputs {
    name: string
    targetAmount: number
    targetDate: string
    categoryIds: number[]
}

export function SavingsGoalEditorDialog({goalToEdit, onClose}: SavingsGoalEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const {savingsClient} = useApiClient()

    const categoriesQuery = useQuery({
        queryKey: ['savings-categories'],
        queryFn: () => savingsClient.getCategories(),
        staleTime: 1000 * 60 * 5
    })

    const {register, control, handleSubmit, setValue, watch, formState: {errors}, reset} = useForm<GoalInputs>({
        defaultValues: {name: "", targetAmount: 0, targetDate: "", categoryIds: []}
    })

    useEffect(() => {
        setIsOpen(!!goalToEdit)
        if (goalToEdit) {
            setValue("name", goalToEdit.id > 0 ? goalToEdit.name : "")
            setValue("targetAmount", goalToEdit.id > 0 ? goalToEdit.targetAmount : 0)
            setValue("targetDate", goalToEdit.id > 0 && goalToEdit.targetDate ? goalToEdit.targetDate : "")
            setValue("categoryIds", goalToEdit.id > 0 ? goalToEdit.categoryIds : [])
        } else {
            reset()
        }
    }, [goalToEdit])

    useEffect(() => {
        if (!isOpen) onClose?.()
    }, [isOpen])

    const mutation = useMutation<void, Error, GoalInputs>({
        mutationFn: async (data: GoalInputs) => {
            const request = {
                name: data.name,
                targetAmount: data.targetAmount,
                targetDate: data.targetDate || null,
                categoryIds: data.categoryIds
            }
            if (goalToEdit && goalToEdit.id > 0) {
                await savingsClient.updateGoal(goalToEdit.id, request)
            } else {
                await savingsClient.createGoal(request)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-goals']})
            reset()
            setIsOpen(false)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const isEditMode = !!(goalToEdit && goalToEdit.id > 0)
    const selectedCategoryIds = watch('categoryIds')

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v)
            reset()
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj cel</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edytuj cel" : "Dodaj cel oszczędnościowy"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane celu i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa celu</Label>
                        <Input {...register("name", {required: true, maxLength: 100})} />
                        {errors.name && <span className="text-red-500 text-xs">Nazwa jest wymagana</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Kwota docelowa (zł)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register("targetAmount", {valueAsNumber: true, required: true, min: 0.01})}
                        />
                        {errors.targetAmount && <span className="text-red-500 text-xs">Podaj kwotę docelową</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Data docelowa (opcjonalna)</Label>
                        <Input type="date" {...register("targetDate")} />
                    </div>

                    {categoriesQuery.data && categoriesQuery.data.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Powiązane kategorie kont</Label>
                            {categoriesQuery.data.map(category => {
                                const isChecked = selectedCategoryIds.includes(category.id)
                                return (
                                    <div key={category.id} className="flex items-center gap-2">
                                        <Controller
                                            name="categoryIds"
                                            control={control}
                                            render={({field}) => (
                                                <Checkbox
                                                    id={`goal-cat-${category.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={checked => {
                                                        const current = field.value ?? []
                                                        field.onChange(
                                                            checked
                                                                ? [...current, category.id]
                                                                : current.filter((id: number) => id !== category.id)
                                                        )
                                                    }}
                                                />
                                            )}
                                        />
                                        <Label htmlFor={`goal-cat-${category.id}`} className="cursor-pointer font-normal">
                                            {category.name}
                                        </Label>
                                    </div>
                                )
                            })}
                        </div>
                    )}

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
