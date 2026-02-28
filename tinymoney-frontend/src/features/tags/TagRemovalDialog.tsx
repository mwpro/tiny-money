import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {type Tag} from "@/lib/api.ts";
import {toast} from "sonner";
import {useEffect, useState} from "react";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface TagRemovalDialogProps {
    tagToRemove?: Tag
}

export function TagRemovalDialog({tagToRemove}: TagRemovalDialogProps) {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false)
    
    const deleteMutation = useMutation({
        mutationFn: (tagId: number) => apiClient.removeTag(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            queryClient.invalidateQueries({queryKey: ['tags']})
            toast.success("Tag usunięty")
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    useEffect(() => {
        setIsOpen(!!tagToRemove);
    }, [tagToRemove]);
    
    if (!tagToRemove) 
        return null;
    
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć tag "{tagToRemove.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {tagToRemove.numberOfTransactions ? `Spowoduje to usunięcie go z ${tagToRemove.numberOfTransactions} transakcji.` : "Nie jest on używany w żadnej transakcji"}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(tagToRemove.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>)
}