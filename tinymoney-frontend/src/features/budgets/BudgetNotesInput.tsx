import {type SubcategoryBudget} from "@/api/ApiTypes.ts";
import {useEffect, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Field} from "@/components/ui/field.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {Pencil} from "lucide-react";

interface BudgetNotesInputProps {
    budget: SubcategoryBudget,
    budgetPeriod: MonthSelection,
    compact?: boolean
}

export function BudgetNotesInput({budget, budgetPeriod, compact}: BudgetNotesInputProps) {
    const { budgetClient } = useApiClient();
    const queryClient = useQueryClient()
    const [budgetNotes, setBudgetNotes] = useState(() => budget.notes);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setBudgetNotes(budget.notes);
    }, [budget]);

    const saveBudgetMutation = useMutation({
        mutationFn: (notes: string | undefined) => budgetClient.saveBudget(budgetPeriod, budget.subcategoryId, budget.amount, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['budget']})
            toast.success("Budżet zapisany");
        },
        onError: (error) => {
            toast.error("Błąd zapisu budżetu: " + error.message)
        }
    })

    if (compact && !isEditing) {
        return (
            <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full text-left"
                onClick={() => setIsEditing(true)}
            >
                <Pencil size={12} className="shrink-0" />
                <span>{budgetNotes || "Dodaj notatkę..."}</span>
            </button>
        );
    }

    return (<>
        <Field orientation="horizontal">
            <Input value={budgetNotes ?? ""} onChange={v => setBudgetNotes(v.target.value)}
                   autoFocus={compact}
                   onKeyDown={k => k.key ===  "Enter" && budgetNotes !== budget.notes && saveBudgetMutation.mutate(budgetNotes)}
                   onBlur={() => {
                       if (budgetNotes !== budget.notes) saveBudgetMutation.mutate(budgetNotes);
                       if (compact) setIsEditing(false);
                   }}
                   className={"h-5 text-xs px-2"}
             />
        </Field>
    </>);
}