import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {removeTag, type Tag} from "@/lib/api.ts";
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useState} from "react";

interface TagRemovalDialogProps {
    tagToRemove?: Tag
}

export function TagRemovalDialog({tagToRemove}: TagRemovalDialogProps) {
    const auth = useAuth0();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false)
    
    const deleteMutation = useMutation({
        mutationFn: (tagId: number) => removeTag(tagId, auth),
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