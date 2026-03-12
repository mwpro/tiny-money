import {useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {CreateApiKeyResponse} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {toast} from "sonner"

interface GenerateKeyDialogProps {
    onCreated: () => void
}

interface CreateApiKeyInputs {
    name: string
}

export function GenerateKeyDialog({onCreated}: GenerateKeyDialogProps) {
    const {apiKeysClient} = useApiClient()
    const [isOpen, setIsOpen] = useState(false)
    const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null)

    const {register, handleSubmit, formState: {errors}, reset} = useForm<CreateApiKeyInputs>({
        defaultValues: {name: ""}
    })

    const mutation = useMutation({
        mutationFn: (data: CreateApiKeyInputs) => apiKeysClient.createApiKey(data),
        onSuccess: (response) => {
            setCreatedKey(response)
            onCreated()
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    const handleClose = (open: boolean) => {
        if (!open) {
            setCreatedKey(null)
            reset()
        }
        setIsOpen(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button>Generuj klucz</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {!createdKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Generuj klucz API</DialogTitle>
                            <DialogDescription>
                                Nadaj kluczowi nazwę, żeby móc go później zidentyfikować.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Nazwa</Label>
                                <Input
                                    {...register("name", {required: "Nazwa jest wymagana"})}
                                    placeholder="np. Mój klucz"
                                />
                                {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Generowanie..." : "Generuj"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Klucz API wygenerowany</DialogTitle>
                            <DialogDescription>
                                Skopiuj klucz teraz — nie zostanie pokazany ponownie.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Twój klucz API</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={createdKey.rawKey} className="font-mono text-xs" />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(createdKey.rawKey)
                                            toast.success("Skopiowano do schowka")
                                        }}
                                    >
                                        Kopiuj
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Użyj w nagłówku <code className="font-mono bg-muted px-1 rounded">Authorization</code>:{" "}
                                    <code className="font-mono bg-muted px-1 rounded">ApiKey {createdKey.rawKey.slice(0, 12)}...</code>
                                </p>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleClose(false)}>Gotowe</Button>
                            </DialogFooter>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
