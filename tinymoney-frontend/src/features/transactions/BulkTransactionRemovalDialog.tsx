import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface BulkTransactionRemovalDialogProps {
    transactionIds: number[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkTransactionRemovalDialog({transactionIds, isOpen, onClose, onSuccess}: BulkTransactionRemovalDialogProps) {
    const { transactionsClient } = useApiClient();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: () => transactionsClient.removeTransactions(transactionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']});
            toast.success(`Usunięto ${transactionIds.length} transakcji`);
            onSuccess();
            onClose();
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message);
        }
    });

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć {transactionIds.length} transakcji?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ta operacja jest nieodwracalna.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "Usuwanie..." : "Usuń"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
