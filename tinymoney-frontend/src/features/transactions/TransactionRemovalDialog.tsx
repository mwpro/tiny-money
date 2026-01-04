import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getVendors, removeTransaction, type Transaction} from "@/lib/api.ts";
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";

interface TransactionRemovalDialogProps {
    transactionToRemove?: Transaction,
    onClose: () => void
}

export function TransactionRemovalDialog({transactionToRemove, onClose}: TransactionRemovalDialogProps) {
    const auth = useAuth0();
    const queryClient = useQueryClient()
    
    const deleteMutation = useMutation({
        mutationFn: (transactionId: number) => removeTransaction(transactionId, auth),
        onSuccess: () => {
            // Sukces!
            queryClient.invalidateQueries({queryKey: ['transactions']})
            toast.success("Transakcja usunięta")
            onClose()
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const dictionariesConfig = { staleTime: 1000 * 60 * 5 }
    const vendorsQuery = useQuery({
        queryKey: ['vendors'],
        queryFn: () => getVendors(auth),
        ...dictionariesConfig
    })
    
    const getVendorName = (id: number) => {
        return vendorsQuery.data?.find(v => v.id === id)?.name || "-"
    }
    
    
    if (!transactionToRemove) 
        return;
    
    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć transakcję?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className={`font-mono ${transactionToRemove.isExpense ? "text-red-600" : "text-green-600"}`}>
                            {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(transactionToRemove.amount)}
                        </span> w {getVendorName(transactionToRemove.vendorId)} z dnia {new Date(transactionToRemove.transactionDate).toLocaleDateString('pl-PL')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onClose()}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(transactionToRemove.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>)
}