import {type SubcategoryBudget} from "@/api/ApiTypes.ts";
import {useEffect, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Field} from "@/components/ui/field.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface BudgetNotesInputProps {
    budget: SubcategoryBudget,
    budgetPeriod: MonthSelection
}

export function BudgetNotesInput({budget, budgetPeriod}: BudgetNotesInputProps) {
    const apiClient = useApiClient();
    const queryClient = useQueryClient()
    const [budgetNotes, setBudgetNotes] = useState(() => budget.notes);

    useEffect(() => {
        setBudgetNotes(budget.notes);
    }, [budget]);

    const saveBudgetMutation = useMutation({
        mutationFn: (notes: string | undefined) => apiClient.saveBudget(budgetPeriod, budget.subcategoryId, budget.amount, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['budget']})
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