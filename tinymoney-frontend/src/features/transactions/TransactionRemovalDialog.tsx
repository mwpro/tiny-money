import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {type Transaction} from "@/api/ApiTypes.ts";
import {toast} from "sonner";
import {Curr} from "@/components/Curr.tsx";
import {useEffect, useState} from "react";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface TransactionRemovalDialogProps {
    transactionToRemove?: Transaction
}

export function TransactionRemovalDialog({transactionToRemove}: TransactionRemovalDialogProps) {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false)
    
    const deleteMutation = useMutation({
        mutationFn: (transactionId: number) => apiClient.removeTransaction(transactionId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            toast.success("Transakcja usunięta")
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    useEffect(() => {
        setIsOpen(!!transactionToRemove);
    }, [transactionToRemove]);

    const dictionariesConfig = { staleTime: 1000 * 60 * 5 }
    const vendorsQuery = useQuery({
        queryKey: ['vendors'],
        queryFn: () => apiClient.getVendors(),
        ...dictionariesConfig
    })
    
    const getVendorName = (id: number) => {
        return vendorsQuery.data?.find(v => v.id === id)?.name || "-"
    }
    
    if (!transactionToRemove) 
        return null;
    
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć transakcję?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <Curr input={transactionToRemove.amount} colored isPositive={!transactionToRemove.isExpense}/> w {getVendorName(transactionToRemove.vendorId)} z dnia {new Date(transactionToRemove.transactionDate).toLocaleDateString('pl-PL')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(transactionToRemove.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>)
}