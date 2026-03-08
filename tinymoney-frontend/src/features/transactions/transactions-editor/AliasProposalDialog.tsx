import {useEffect, useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {type SuggestedAlias, type Vendor} from "@/api/ApiTypes.ts"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input.tsx"
import {Label} from "@/components/ui/label"
import {X} from "lucide-react"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface AliasProposalDialogProps {
    suggestedAlias: SuggestedAlias | null;
    transactionDescription: string | undefined;
    vendors: Vendor[];
    onClose: () => void;
}

export function AliasProposalDialog({suggestedAlias, transactionDescription, vendors, onClose}: AliasProposalDialogProps) {
    const {vendorsClient} = useApiClient()
    const [editedAlias, setEditedAlias] = useState(suggestedAlias?.alias ?? "")

    useEffect(() => {
        if (suggestedAlias) {
            setEditedAlias(suggestedAlias.alias)
        }
    }, [suggestedAlias])

    const vendorName = suggestedAlias
        ? (vendors.find(v => v.id === suggestedAlias.vendorId)?.name ?? "")
        : ""

    const addAliasMutation = useMutation({
        mutationFn: () => vendorsClient.addVendorAlias(suggestedAlias!.vendorId, editedAlias.trim()),
        onSuccess: () => onClose(),
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    return (
        <Dialog open={suggestedAlias !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dodaj słowo kluczowe</DialogTitle>
                    <DialogDescription>
                        Opis tej transakcji nie pasuje do żadnego słowa kluczowego sprzedawcy <strong>{vendorName}</strong>.
                        Czy chcesz dodać poniższe słowo kluczowe, aby transakcje z podobnym opisem były wykrywane automatycznie?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {transactionDescription && (
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Oryginalny opis transakcji</Label>
                            <p className="text-sm bg-muted rounded px-3 py-2 break-all whitespace-pre-wrap">{transactionDescription}</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Słowo kluczowe</Label>
                        <div className="flex gap-2">
                            <Input
                                value={editedAlias}
                                onChange={e => setEditedAlias(e.target.value)}
                                className="grow"
                            />
                            {editedAlias && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditedAlias("")}
                                    tabIndex={-1}
                                >
                                    <X size={16} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Pomiń
                    </Button>
                    <Button
                        type="button"
                        onClick={() => addAliasMutation.mutate()}
                        disabled={!editedAlias.trim() || addAliasMutation.isPending}
                    >
                        Dodaj słowo kluczowe
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
