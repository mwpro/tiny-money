import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {ApiKeySummary} from "@/api/ApiTypes.ts"
import {Button} from "@/components/ui/button"
import {toast} from "sonner"

interface ApiKeyRowProps {
    apiKey: ApiKeySummary
    onDeleted: () => void
}

export function ApiKeyRow({apiKey, onDeleted}: ApiKeyRowProps) {
    const {apiKeysClient} = useApiClient()

    const deleteMutation = useMutation({
        mutationFn: () => apiKeysClient.deleteApiKey(apiKey.id),
        onSuccess: onDeleted,
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{apiKey.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{apiKey.keyPrefix}...</span>
                <span className="text-xs text-muted-foreground">
                    Utworzono {new Date(apiKey.createdAt).toLocaleDateString()}
                    {apiKey.lastUsedAt && <> · Ostatnio użyto {new Date(apiKey.lastUsedAt).toLocaleDateString()}</>}
                </span>
            </div>
            <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
            >
                Usuń
            </Button>
        </div>
    )
}
