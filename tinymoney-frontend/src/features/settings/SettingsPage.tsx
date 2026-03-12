import {useQuery, useQueryClient} from "@tanstack/react-query"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import {ApiKeyRow} from "@/features/settings/ApiKeyRow.tsx"
import {GenerateKeyDialog} from "@/features/settings/GenerateKeyDialog.tsx"

export function SettingsPage() {
    const {apiKeysClient} = useApiClient()
    const queryClient = useQueryClient()

    const keysQuery = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => apiKeysClient.getApiKeys()
    })

    const invalidate = () => queryClient.invalidateQueries({queryKey: ['api-keys']})

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Ustawienia</h1>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-medium">Klucze API</h2>
                        <p className="text-sm text-muted-foreground">Używaj kluczy API do uwierzytelniania żądań z zewnętrznych narzędzi.</p>
                    </div>
                    <GenerateKeyDialog onCreated={invalidate} />
                </div>

                {keysQuery.isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
                {keysQuery.isError && <p className="text-sm text-destructive">Błąd ładowania kluczy API.</p>}

                {keysQuery.data && keysQuery.data.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">Brak kluczy API.</p>
                )}

                {keysQuery.data && keysQuery.data.length > 0 && (
                    <div className="border rounded-md divide-y">
                        {keysQuery.data.map(key => (
                            <ApiKeyRow key={key.id} apiKey={key} onDeleted={invalidate} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
