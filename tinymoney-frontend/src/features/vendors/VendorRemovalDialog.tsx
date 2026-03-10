import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {type VendorDetails} from "@/api/ApiTypes.ts";
import {toast} from "sonner";
import {useEffect, useState} from "react";
import Autocomplete from "@/components/Autocomplete.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface VendorRemovalDialogProps {
    vendorToRemove?: VendorDetails,
    vendors?: VendorDetails[],
    onClose: () => void
}

export function VendorRemovalDialog({vendorToRemove, vendors, onClose}: VendorRemovalDialogProps) {
    const { vendorsClient } = useApiClient();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [vendorToMerge, setVendorToMerge] = useState<{ id?: number; name: string }>()

    const deleteMutation = useMutation({
        mutationFn: (vendorId: number) => vendorsClient.removeVendor(vendorId, vendorToMerge?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            queryClient.invalidateQueries({queryKey: ['vendors-details']})
            queryClient.invalidateQueries({queryKey: ['vendors']})
            toast.success("Sprzedawca usunięty")
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    useEffect(() => {
        setIsOpen(!!vendorToRemove);
        setVendorToMerge(undefined);
    }, [vendorToRemove]);

    if (!vendorToRemove)
        return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć sprzedawcę "{vendorToRemove.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {vendorToRemove.numberOfTransactions == 0 && (
                            "Sprzedawca nie jest używany w żadnej transakcji."
                        )}
                        {vendorToRemove.numberOfTransactions > 0 && (
                            <>
                                Sprzedawca jest przypisany do {vendorToRemove.numberOfTransactions} transakcji.<br />
                                Należy wskazać nowego sprzedawcę do którego zostaną one przypisane:<br />

                                
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {vendorToRemove.numberOfTransactions > 0 && <Autocomplete fetchSuggestions={async input => (vendors || []).filter(o => o.id != vendorToRemove.id && o.name.toLowerCase().includes(input.toLowerCase()))}
                              value={vendorToMerge?.name}
                              placeholder="Wybierz nowego sprzedawcę"
                              clearQueryAfterSelection={false}
                              onChange={value => {
                                  if (!value) {
                                      setVendorToMerge(undefined);
                                      return
                                  }
                                  setVendorToMerge(value)
                              }} allowCustomValues={false}/>
                }
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive"
                                       disabled={vendorToRemove.numberOfTransactions > 0 && !vendorToMerge}
                                       onClick={() => deleteMutation.mutate(vendorToRemove.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>)
}