import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "sonner"
import {useEffect, useState} from "react"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {SavingsGoal} from "@/api/ApiTypes.ts"

interface SavingsGoalRemovalDialogProps {
    goalToRemove?: SavingsGoal
    onClose: () => void
}

export function SavingsGoalRemovalDialog({goalToRemove, onClose}: SavingsGoalRemovalDialogProps) {
    const {savingsClient} = useApiClient()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false)

    const deleteMutation = useMutation({
        mutationFn: (id: number) => savingsClient.deleteGoal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-goals']})
            toast.success("Cel usunięty")
            setIsOpen(false)
        },
        onError: (error: Error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    useEffect(() => {
        setIsOpen(!!goalToRemove)
    }, [goalToRemove])

    if (!goalToRemove)
        return null

    return (
        <AlertDialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć cel "{goalToRemove.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tej operacji nie można cofnąć. Dane kont i historyczne snapshoty nie zostaną usunięte.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive"
                        onClick={() => deleteMutation.mutate(goalToRemove.id)}
                        disabled={deleteMutation.isPending}
                    >
                        Usuń
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
