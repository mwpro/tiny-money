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
import {useEffect, useState} from "react";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import type {SavingsCategory} from "@/api/ApiTypes.ts";

interface SavingsCategoryRemovalDialogProps {
    categoryToRemove?: SavingsCategory,
    onClose: () => void
}

export function SavingsCategoryRemovalDialog({categoryToRemove, onClose}: SavingsCategoryRemovalDialogProps) {
    const {savingsClient} = useApiClient();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false)

    const deleteMutation = useMutation({
        mutationFn: (id: number) => savingsClient.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-categories']})
            queryClient.invalidateQueries({queryKey: ['savings-accounts']})
            toast.success("Kategoria usunięta")
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    useEffect(() => {
        setIsOpen(!!categoryToRemove);
    }, [categoryToRemove]);

    if (!categoryToRemove)
        return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć kategorię "{categoryToRemove.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tej operacji nie można cofnąć.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(categoryToRemove.id)}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>)
}
