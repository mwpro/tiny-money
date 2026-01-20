import type {BudgetEntry} from "@/lib/api.ts";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {useEffect, useState} from "react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";

interface BudgetInputProps {
    budget: BudgetEntry
}

export function BudgetInput({budget}: BudgetInputProps) {
    const [isOpen, setOpen] = useState(false)
    const [budgetValue, setBudgetValue] = useState(() => budget.amount);
    const [commandInput, setCommandInput] = useState(() => budget.amount.toString())

    useEffect(() => {
        setBudgetValue(budget.amount);
        setCommandInput(budget.amount.toString())
    }, [budget]);
    
    const suggestions = [
        {"value": 32.64, "label": "Poprzedni miesiąc - budżet"},
        {"value": 256.32, "label": "Poprzedni miesiąc - wydatki"},
        {"value": 128.64, "label": "Średnie wydatki za 3 ostatnie mc"},
        {"value": 300, "label": "Ten miesiąc rok temu - wydatki"},
    ];
    
    console.log([budget, budgetValue])
    return (<>
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger className={"cursor-text"}>
                {new Intl.NumberFormat('pl-PL', {
                    style: 'currency',
                    currency: 'PLN'
                }).format(budgetValue)}
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Podaj kwotę..." value={commandInput} onValueChange={v => setCommandInput(v)} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            { Number(commandInput.replace(",", ".")) >= 0 && (
                                <CommandItem
                                    value={commandInput || "0"}
                                    onSelect={() => {
                                        setBudgetValue(Number(commandInput.replace(",", ".")))
                                        setOpen(false)
                                    }}
                                    className={"flex justify-between"}
                                >
                                    <div>Własna wartość</div>
                                    <div className={"font-mono text-right"}>
                                        {new Intl.NumberFormat('pl-PL', {
                                            style: 'currency',
                                            currency: 'PLN'
                                        }).format(Number(commandInput.replace(",", ".")))}
                                    </div>
                                </CommandItem>
                            )
                            }
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