import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Delete } from 'lucide-react'
import {cn} from "@/lib/utils.ts";

interface AutoCompleteProps {
    value?: string,
    onChange?: (value: { id?: number; name: string } | undefined) => void,
    fetchSuggestions: (value: string) => Promise<{ id?: number; name: string }[]>,
    clearQueryAfterSelection: boolean,
    allowCustomValues: boolean,
    placeholder?: string | undefined,
    className?: string | undefined,
    deletable?: boolean | undefined
}

export default function Autocomplete({ value = '', onChange, fetchSuggestions, clearQueryAfterSelection, allowCustomValues, placeholder, className, deletable }: AutoCompleteProps) {
    const [query, setQuery] = useState(value)
    const [foundLiteralMatch, setFoundLiteralMatch] = useState(false)
    const [suggestions, setSuggestions] = useState<{ id?: number; name: string }[]>([])
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isLoading, setIsLoading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const fetchSuggestionsCallback = useCallback(async (q: string) => {
        if (q.trim() === '') {
            setSuggestions([])
            return
        }
        setIsLoading(true)
        const results = await fetchSuggestions(q)
        setSuggestions(results)
        setFoundLiteralMatch(!!results.find(s => s.name.toLowerCase() == q?.toLowerCase()));
        setIsLoading(false)
    }, [fetchSuggestions])


    useEffect(() => {
        setQuery(value)
        setSelectedIndex(-1)
    }, [value]);
    
    useEffect(() => {
        if (query && isFocused) {
            fetchSuggestionsCallback(query)
        } else {
            setSuggestions([])
        }
    }, [query, fetchSuggestionsCallback, isFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setQuery(newValue)
        setSelectedIndex(-1)
        if (newValue) {
            setIsFocused(true);
        } else {
            handleSuggestionChosen(undefined);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) =>
                prev <
                (foundLiteralMatch ? suggestions.length - 1 : suggestions.length)
                    ? prev + 1 : prev,
            )
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        } else if ((e.key === 'Enter' || e.key === "Tab") && selectedIndex >= 0) {
            e.key === "Enter" && e.preventDefault();
            if (selectedIndex < suggestions.length){
                handleSuggestionChosen(suggestions[selectedIndex]);
            } else {
                handleSuggestionChosen({name: query});
            }
            handleBlur();
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setSuggestions([])
            setSelectedIndex(-1)
        }
    }

    const handleSuggestionChosen = (suggestion: { id?: number; name: string } | undefined) => {
        setQuery(clearQueryAfterSelection || !suggestion ? "" : suggestion.name)
        onChange?.(suggestion)
        setSuggestions([])
        setSelectedIndex(-1)
    }

    const handleFocus = () => {
        setIsFocused(true)
    }

    const handleBlur = () => {
        // Delay hiding suggestions to allow for click events on suggestions
        setTimeout(() => {
            setIsFocused(false)
            setSuggestions([])
            setSelectedIndex(-1)
        }, 200)
    }

    return (
        <div className={className}>
            <div className="relative">
                <Input
                    type="text"
                    placeholder={placeholder ?? "Zacznij wpisywać..."}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="pr-10"
                    aria-label="Search input"
                    aria-autocomplete="list"
                    aria-controls="suggestions-list"
                    aria-expanded={suggestions.length > 0}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn("absolute right-0 top-0 h-full", (deletable && value) ? "text-gray-500" : "")}
                    tabIndex={-1}
                    onClick={() => deletable && value && handleSuggestionChosen(undefined) }
                >
                    {(deletable && value) ? <Delete className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
            {isLoading && isFocused && (
                <div
                    className="mt-2 p-2 bg-background border rounded-md shadow-sm absolute z-10"
                    aria-live="polite"
                >
                    Loading...
                </div>
            )}

            <ul
                id="suggestions-list"
                className="mt-2 bg-background border rounded-md shadow-sm absolute z-10"
                role="listbox"
            >
            {suggestions.length > 0 && !isLoading && isFocused 
                && suggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-muted ${
                                index === selectedIndex ? 'bg-muted' : ''
                            }`}
                            onClick={() => handleSuggestionChosen(suggestion)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            {suggestion.name}
                        </li>
                    ))
            }
            {allowCustomValues && !isLoading && isFocused && !foundLiteralMatch 
                && query.trim() && (
                <li key="AddNew" className={`px-4 py-2 cursor-pointer hover:bg-muted ${
                    suggestions.length === selectedIndex ? 'bg-muted' : ''
                }`}
                    onClick={() => handleSuggestionChosen(({name: query}))}
                    role="option"
                >Dodaj {query}</li>
            )}

            </ul>
        </div>
    )
}
