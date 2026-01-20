import type {BudgetEntry} from "@/lib/api.ts";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {useState} from "react";
import {Command, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";

interface BudgetInputProps {
    budget: BudgetEntry
}

export function BudgetInput({budget}: BudgetInputProps) {
    const [isOpen, setOpen] = useState(false)
    const [budgetValue, setBudgetValue] = useState(budget.amount);

    const suggestions = [
        {"value": 32.64, "label": "Poprzedni miesiąc - budżet"},
        {"value": 256.32, "label": "Poprzedni miesiąc - wydatki"},
        {"value": 128.64, "label": "Średnie wydatki za 3 ostatnie mc"},
        {"value": 0, "label": "Ten miesiąc rok temu - wydatki"},
        
    ];
    return (<>

        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger className={"cursor-text"}>
                {new Intl.NumberFormat('pl-PL', {
                    style: 'currency',
                    currency: 'PLN'
                }).format(budgetValue)}
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="start">
                <Command>
                    <CommandInput placeholder="Podaj kwotę..." />
                    <CommandList>
                        {/*<CommandEmpty>No results found.</CommandEmpty>*/}
                        <CommandGroup>
                            {suggestions.map((suggestion) => (
                                <CommandItem
                                    key={suggestion.value}
                                    value={suggestion.value.toString()}
                                    onSelect={(value) => {
                                        setBudgetValue(Number(value))
                                        setOpen(false)
                                    }}
                                    className={"flex justify-between"}
                                >
                                    <div>{suggestion.label}</div>
                                    <div className={"font-mono text-right"}>
                                        {new Intl.NumberFormat('pl-PL', {
                                            style: 'currency',
                                            currency: 'PLN'
                                        }).format(suggestion.value)}
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