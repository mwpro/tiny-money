import {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {PlusIcon} from "lucide-react"
import type {PlanTagLine} from "@/api/ApiTypes.ts"
import Autocomplete from "@/components/Autocomplete.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input.tsx"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea.tsx"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface PlanTagDialogProps {
    planId: number;
    existingTagIds: number[];
    tagLine?: PlanTagLine;
    onEditClose: () => void;
}

interface FormInputs {
    amount: number;
    description: string;
}

export function PlanTagEditorDialog({planId, existingTagIds, tagLine, onEditClose}: PlanTagDialogProps) {
    const {plansClient, tagsClient} = useApiClient()
    const queryClient = useQueryClient()
    const [addOpen, setAddOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<{ id?: number; name: string } | undefined>(undefined)
    const [tagError, setTagError] = useState(false)

    const isEditMode = !!tagLine
    const open = isEditMode || addOpen

    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => tagsClient.getTags()
    })

    const {register, handleSubmit, setValue, reset, formState: {errors}} = useForm<FormInputs>()

    useEffect(() => {
        if (tagLine) {
            setValue("amount", tagLine.amount)
            setValue("description", tagLine.description ?? "")
        }
    }, [tagLine])

    const handleClose = () => {
        if (isEditMode) {
            onEditClose()
        } else {
            setAddOpen(false)
            reset()
            setSelectedTag(undefined)
            setTagError(false)
        }
    }

    const addMutation = useMutation({
        mutationFn: async (data: FormInputs) => {
            let tagId = selectedTag!.id
            if (!tagId) {
                const created = await tagsClient.addTag({name: selectedTag!.name})
                tagId = created.id
            }
            return plansClient.addPlanTag(planId, {
                tagId,
                amount: Number(data.amount),
                description: data.description || undefined
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['plans']})
            queryClient.invalidateQueries({queryKey: ['tags']})
            handleClose()
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const editMutation = useMutation({
        mutationFn: (data: FormInputs) =>
            plansClient.updatePlanTag(planId, tagLine!.tagId, {
                amount: Number(data.amount),
                description: data.description || undefined
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['plans', planId]})
            handleClose()
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: FormInputs) => {
        if (!isEditMode && !selectedTag) {
            setTagError(true)
            return
        }
        setTagError(false)
        if (isEditMode) {
            editMutation.mutate(data)
        } else {
            addMutation.mutate(data)
        }
    }

    const isPending = addMutation.isPending || editMutation.isPending
    const availableTags = (tagsQuery.data ?? []).filter(t => !existingTagIds.includes(t.id))

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddOpen(true)}
            >
                <PlusIcon className="size-4 mr-1"/>
                Dodaj pozycję
            </Button>

            <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
                <DialogContent className="sm:max-w-[420px]" onCloseAutoFocus={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? `Edytuj pozycję — ${tagLine?.tagName}` : "Dodaj pozycję"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? "Zmień kwotę lub opis pozycji." : "Wybierz tag i określ kwotę budżetu."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                        {!isEditMode && (
                            <div className="grid gap-2">
                                <Label>Tag</Label>
                                <Autocomplete
                                    fetchSuggestions={async (input) =>
                                        availableTags
                                            .filter(t => t.name.toLowerCase().includes(input.toLowerCase()))
                                            .slice(0, 10)
                                    }
                                    clearQueryAfterSelection={false}
                                    allowCustomValues={true}
                                    placeholder="Wybierz lub utwórz tag..."
                                    onChange={(v) => {
                                        setSelectedTag(v)
                                        setTagError(false)
                                    }}
                                    value={selectedTag?.name ?? ""}
                                />
                                <div className="min-h-[1.25rem]">
                                    {tagError && <span className="text-destructive text-xs">Wybierz tag</span>}
                                </div>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Kwota budżetu</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register("amount", {required: true, min: 0.01})}
                            />
                            <div className="min-h-[1.25rem]">
                                {errors.amount && <span className="text-destructive text-xs">Podaj kwotę większą niż 0</span>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Opis pozycji (opcjonalnie)</Label>
                            <Textarea {...register("description")} rows={2} placeholder="Np. szczegóły budżetu..."/>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? (isEditMode ? "Zapisywanie..." : "Dodawanie...")
                                    : (isEditMode ? "Zapisz" : "Dodaj")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
