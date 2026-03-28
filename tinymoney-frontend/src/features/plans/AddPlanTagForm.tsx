import {useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {PlusIcon} from "lucide-react"
import Autocomplete from "@/components/Autocomplete.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input.tsx"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea.tsx"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface AddPlanTagFormProps {
    planId: number;
    existingTagIds: number[];
}

interface FormInputs {
    amount: number;
    description: string;
}

export function AddPlanTagForm({planId, existingTagIds}: AddPlanTagFormProps) {
    const {plansClient, tagsClient} = useApiClient()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<{ id?: number; name: string } | undefined>(undefined)
    const [tagError, setTagError] = useState(false)

    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: () => tagsClient.getTags()
    })

    const {register, handleSubmit, formState: {errors}, reset} = useForm<FormInputs>()

    const mutation = useMutation({
        mutationFn: async (data: FormInputs) => {
            if (!selectedTag) throw new Error("Wybierz tag")
            let tagId = selectedTag.id
            if (!tagId) {
                const created = await tagsClient.addTag({name: selectedTag.name})
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
            reset()
            setSelectedTag(undefined)
            setOpen(false)
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: FormInputs) => {
        if (!selectedTag) {
            setTagError(true)
            return
        }
        setTagError(false)
        mutation.mutate(data)
    }

    const availableTags = (tagsQuery.data ?? []).filter(t => !existingTagIds.includes(t.id))

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
            >
                <PlusIcon className="size-4 mr-1"/>
                Dodaj pozycję
            </Button>

            <Dialog open={open} onOpenChange={(v) => {
                setOpen(v)
                if (!v) {
                    reset()
                    setSelectedTag(undefined)
                    setTagError(false)
                }
            }}>
                <DialogContent className="sm:max-w-[420px]" onCloseAutoFocus={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Dodaj pozycję</DialogTitle>
                        <DialogDescription>Wybierz tag i określ kwotę budżetu.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Dodawanie..." : "Dodaj"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
