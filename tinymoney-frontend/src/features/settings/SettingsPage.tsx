import {useState} from "react"
import {useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {ApiKeySummary, CreateApiKeyResponse} from "@/api/ApiTypes.ts"
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

interface CreateApiKeyInputs {
    name: string
}

export function SettingsPage() {
    const {apiKeysClient} = useApiClient()
    const queryClient = useQueryClient()

    const keysQuery = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => apiKeysClient.getApiKeys()
    })

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-medium">API Keys</h2>
                        <p className="text-sm text-muted-foreground">Use API keys to authenticate requests from Apple Shortcuts or other automation tools.</p>
                    </div>
                    <GenerateKeyDialog onCreated={() => queryClient.invalidateQueries({queryKey: ['api-keys']})} />
                </div>

                {keysQuery.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {keysQuery.isError && <p className="text-sm text-destructive">Failed to load API keys.</p>}

                {keysQuery.data && keysQuery.data.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">No API keys yet.</p>
                )}

                {keysQuery.data && keysQuery.data.length > 0 && (
                    <div className="border rounded-md divide-y">
                        {keysQuery.data.map(key => (
                            <ApiKeyRow
                                key={key.id}
                                apiKey={key}
                                onDeleted={() => queryClient.invalidateQueries({queryKey: ['api-keys']})}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function ApiKeyRow({apiKey, onDeleted}: { apiKey: ApiKeySummary; onDeleted: () => void }) {
    const {apiKeysClient} = useApiClient()

    const deleteMutation = useMutation({
        mutationFn: () => apiKeysClient.deleteApiKey(apiKey.id),
        onSuccess: onDeleted,
        onError: (error) => toast.error("Error: " + error.message)
    })

    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{apiKey.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{apiKey.keyPrefix}...</span>
                <span className="text-xs text-muted-foreground">
                    Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    {apiKey.lastUsedAt && <> · Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</>}
                </span>
            </div>
            <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
            >
                Revoke
            </Button>
        </div>
    )
}

function GenerateKeyDialog({onCreated}: { onCreated: () => void }) {
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
        onError: (error) => toast.error("Error: " + error.message)
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
                <Button>Generate key</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {!createdKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Generate API key</DialogTitle>
                            <DialogDescription>
                                Give this key a name so you can identify it later.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    {...register("name", {required: "Name is required"})}
                                    placeholder="e.g. Apple Shortcuts"
                                />
                                {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Generating..." : "Generate"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>API key generated</DialogTitle>
                            <DialogDescription>
                                Copy this key now — it will not be shown again.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Your API key</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={createdKey.rawKey} className="font-mono text-xs" />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(createdKey.rawKey)
                                            toast.success("Copied to clipboard")
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Use it in the <code className="font-mono bg-muted px-1 rounded">Authorization</code> header:{" "}
                                    <code className="font-mono bg-muted px-1 rounded">ApiKey {createdKey.rawKey.slice(0, 12)}...</code>
                                </p>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleClose(false)}>Done</Button>
                            </DialogFooter>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
