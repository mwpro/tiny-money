import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Prosty interfejs dla elementów listy
export interface Option {
    id: number
    name: string
}

interface SmartComboboxProps {
    options: Option[]
    value?: { id?: number; name: string } // Aktualnie wybrana wartość (obiekt!)
    onChange: (value: { id?: number; name: string }) => void // Funkcja zmieniająca
    placeholder?: string
}

export function SmartCombobox({ options, value, onChange, placeholder }: SmartComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("") // To co użytkownik wpisuje

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {/* Jeśli mamy wybraną wartość, wyświetl jej nazwę. Jeśli nie - placeholder */}
                    {value?.name ? value.name : (placeholder || "Wybierz...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Szukaj lub dodaj..."
                        onValueChange={setInputValue} // Zapisujemy co user wpisuje
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 px-2">
                            {/* Jeśli nie znaleziono, pokaż przycisk "Utwórz" */}
                            <div className="text-sm text-slate-500 mb-2">Brak wyników.</div>
                            {inputValue && (
                                <Button
                                    variant="secondary"
                                    className="w-full h-8 text-xs justify-start"
                                    onClick={() => {
                                        // LOGIKA TWORZENIA NOWEGO (ID: undefined)
                                        onChange({ id: undefined, name: inputValue })
                                        setOpen(false)
                                    }}
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Utwórz "{inputValue}"
                                </Button>
                            )}
                        </CommandEmpty>

                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.name} // Ważne: wyszukiwanie po nazwie
                                    onSelect={() => {
                                        // LOGIKA WYBORU ISTNIEJĄCEGO
                                        onChange({ id: option.id, name: option.name })
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value?.id === option.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}