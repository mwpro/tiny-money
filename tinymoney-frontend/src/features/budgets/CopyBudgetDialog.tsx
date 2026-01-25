import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {copyBudget} from "@/lib/api.ts";
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useState} from "react";
import {parse, subMonths} from "date-fns";
import {Button} from "@/components/ui/button.tsx";

interface CopyBudgetDialogProps {
    currentMonth: MonthSelection
}

export function CopyBudgetDialog({currentMonth}: CopyBudgetDialogProps) {
    const auth = useAuth0();
    const queryClient = useQueryClient()

    const [isOpen, setIsOpen] = useState(false)
    const [fromPeriod, setFromPeriod] = useState(currentMonth);
    const [toPeriod, setToPeriod] = useState(currentMonth);
    
    useEffect(() => {
        const parsedToPeriod = parse(`${currentMonth.year}-${currentMonth.month}`, "yyyy-MM", new Date());
        const fromMonth = subMonths(parsedToPeriod, 1);
        const fromPeriod: MonthSelection = {
            year: fromMonth.getFullYear(),
            month: fromMonth.getMonth() + 1
        };
        
        setFromPeriod(fromPeriod);
        setToPeriod(currentMonth);
        
    }, [currentMonth]);
    
    const copyMutation = useMutation({
        mutationFn: () => copyBudget(auth, fromPeriod, toPeriod),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['budget']})
            toast.success("Budżet skopiowany")
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })
    
    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Skopiuj budżet</Button>
            <AlertDialog open={isOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Skopiuj budżet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aktualny budżet zostanie nadpisany
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-row gap-3 items-center">
                        <div>Z: </div>
                        <MonthPicker month={fromPeriod} onChange={setFromPeriod} />
                    </div>
                    <div className="flex flex-row gap-3 items-center">
                        <div>Do: </div>
                        <MonthPicker month={toPeriod} onChange={setToPeriod} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsOpen(false)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={() => copyMutation.mutate()}>Kopiuj</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>)
}