import {useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useNavigate} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {toast} from "sonner"
import {useApiClient} from "@/api/ApiClientProvider.tsx"

interface PlanDeleteDialogProps {
    planId: number;
    planTitle: string;
}

export function PlanDeleteDialog({planId, planTitle}: PlanDeleteDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const {plansClient} = useApiClient()

    const mutation = useMutation({
        mutationFn: () => plansClient.deletePlan(planId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['plans']})
            queryClient.invalidateQueries({queryKey: ['dashboard']})
            navigate('/plans')
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
            setIsOpen(false)
        }
    })

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-white">Usuń plan</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Usuń plan</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno chcesz usunąć plan <strong>{planTitle}</strong>?
                        Ta operacja jest nieodwracalna.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Usuwanie..." : "Usuń"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
