import {saveBudget, type SubcategoryBudget} from "@/lib/api.ts";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {useEffect, useState} from "react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {useAuth0} from "@auth0/auth0-react";
import type {MonthSelection} from "@/components/MonthPicker.tsx";
import {curr} from "@/lib/utils.ts";

interface BudgetAmountInputProps {
    budget: SubcategoryBudget,
    budgetPeriod: MonthSelection
}

export function BudgetAmountInput({budget, budgetPeriod}: BudgetAmountInputProps) {
    const auth = useAuth0();
    const queryClient = useQueryClient()

    const [isOpen, setOpen] = useState(false)
    const [budgetValue, setBudgetValue] = useState(() => budget.amount);
    const [commandInput, setCommandInput] = useState(() => budget.amount.toString())

    useEffect(() => {
        setBudgetValue(budget.amount);
        setCommandInput(budget.amount.toString())
    }, [budget]);

    const saveBudgetMutation = useMutation({
        mutationFn: (budgetValue: number) => saveBudget(budgetPeriod, budget.subcategoryId, budgetValue, budget.notes, auth),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['budget']})
            toast.success("Budżet zapisany")
            setOpen(false)
        },
        onError: (error) => {
            toast.error("Błąd zapisu budżetu: " + error.message)
        }
    })

    const suggestions = [
        {"value": 32.64, "label": "Poprzedni miesiąc - budżet"},
        {"value": 256.32, "label": "Poprzedni miesiąc - wydatki"},
        {"value": 128.64, "label": "Średnie wydatki za 3 ostatnie mc"},
        {"value": 300, "label": "Ten miesiąc rok temu - wydatki"},
    ];

    return (<>
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger className={"cursor-text"}>
                {curr(budgetValue)}
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Podaj kwotę..." value={commandInput}
                                  onValueChange={v => setCommandInput(v)}/>
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {Number(commandInput.replace(",", ".")) >= 0 && (
                                <CommandItem
                                    value={commandInput || "0"}
                                    onSelect={() => {
                                        const parsed = Number(commandInput.replace(",", "."));
                                        setBudgetValue(parsed)
                                        saveBudgetMutation.mutate(parsed)
                                    }}
                                    className={"flex justify-between"}
                                >
                                    <div>Własna wartość</div>
                                    <div className={"font-mono text-right"}>
                                        {curr(commandInput)}
                                    </div>
                                </CommandItem>
                            )
                            }
                            {suggestions.map((suggestion) => (
                                <CommandItem
                                    key={suggestion.value}
                                    value={suggestion.value.toString()}
                                    onSelect={(value) => {
                                        const parsed = Number(value);
                                        setBudgetValue(parsed)
                                        saveBudgetMutation.mutate(parsed)
                                    }}
                                    className={"flex justify-between"}
                                >
                                    <div>{suggestion.label}</div>
                                    <div className={"font-mono text-right"}>
                                        {curr(suggestion.value)}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </>);
}