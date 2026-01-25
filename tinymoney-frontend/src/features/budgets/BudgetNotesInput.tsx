import {saveBudget, type SubcategoryBudget} from "@/lib/api.ts";
import {useEffect, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Field} from "@/components/ui/field.tsx";

interface BudgetNotesInputProps {
    budget: SubcategoryBudget,
    budgetPeriod: MonthSelection
}

export function BudgetNotesInput({budget, budgetPeriod}: BudgetNotesInputProps) {
    const auth = useAuth0();
    const [budgetNotes, setBudgetNotes] = useState(() => budget.notes);

    useEffect(() => {
        setBudgetNotes(budget.notes);
    }, [budget]);

    const saveBudgetMutation = useMutation({
        mutationFn: (notes: string | undefined) => saveBudget(budgetPeriod, budget.subcategoryId, budget.amount, notes, auth),
        onSuccess: () => {
            // no need to invalidate queres as saving notes does not impact amounts
            toast.success("Budżet zapisany");
        },
        onError: (error) => {
            toast.error("Błąd zapisu budżetu: " + error.message)
        }
    })
    
    return (<>
        <Field orientation="horizontal">
            <Input value={budgetNotes ?? ""} onChange={v => setBudgetNotes(v.target.value)} 
                   onKeyDown={k => k.key ===  "Enter" && budgetNotes !== budget.notes && saveBudgetMutation.mutate(budgetNotes)}
                   onBlur={() => budgetNotes !== budget.notes && saveBudgetMutation.mutate(budgetNotes)}
                   className={"h-5 text-xs px-2"}
             />
        </Field>
    </>);
}