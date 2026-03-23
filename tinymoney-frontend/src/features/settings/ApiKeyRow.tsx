import {useMutation} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {ApiKeySummary} from "@/api/ApiTypes.ts"
import {Button, buttonVariants} from "@/components/ui/button"
import {toast} from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                    >
                        Usuń
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń klucz API</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz usunąć klucz <span className="font-medium text-foreground">{apiKey.name}</span>? Tej operacji nie można cofnąć.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({variant: "destructive"})}
                            onClick={() => deleteMutation.mutate()}
                        >
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
