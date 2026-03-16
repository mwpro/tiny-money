import {useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group"
import {toast} from "sonner"

interface AddCategoryDialogProps {
    onCreated: () => void
}

interface FormValues {
    name: string
    type: "income" | "expense"
}

export function AddCategoryDialog({onCreated}: AddCategoryDialogProps) {
    const {categoriesClient} = useApiClient()
    const [isOpen, setIsOpen] = useState(false)

    const {register, handleSubmit, control, formState: {errors}, reset} = useForm<FormValues>({
        defaultValues: {name: "", type: "expense"}
    })

    const mutation = useMutation({
        mutationFn: (data: FormValues) => categoriesClient.createCategory(data.name, data.type === "income"),
        onSuccess: () => {
            reset()
            setIsOpen(false)
            onCreated()
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) reset() }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">+ Dodaj kategorię</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Dodaj kategorię</DialogTitle>
                    <DialogDescription>Podaj nazwę i wybierz typ kategorii.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa</Label>
                        <Input
                            {...register("name", {required: "Nazwa jest wymagana"})}
                            placeholder="Nazwa kategorii"
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                    </div>
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
