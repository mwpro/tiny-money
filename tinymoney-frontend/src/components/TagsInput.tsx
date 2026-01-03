import {Badge} from "@/components/ui/badge.tsx";
import {useCallback, useState} from "react";
import Autocomplete from "@/components/Autocomplete.tsx";


// Prosty interfejs dla elementów listy
export interface Option {
    id: number
    name: string
}

interface TagsInputProps {
    options: Option[],
    value: { id?: number; name: string }[],
    onChange: (value: { id?: number; name: string }[]) => void // Funkcja zmieniająca
}

export function TagsInput({options, value, onChange}: TagsInputProps){
    const [selectedTags, setSelectedTags] = useState<{ id?: number; name: string }[]>(value);

    const addTag = (newTag: { id?: number; name: string }) => {
        if (newTag && !selectedTags.some(tag => (newTag.id != null && tag.id == newTag.id) || newTag.name == tag.name)) {
            const updatedTags = [...selectedTags, newTag];
            setSelectedTags(updatedTags);
            onChange(updatedTags);
        }
    };

    const removeTag = (tag: { id?: number; name: string }) => {
        const updatedTags = selectedTags.filter((c) => c !== tag);
        setSelectedTags(updatedTags);
        onChange(updatedTags);
    };
    
    const fetchSuggestions =async (value: string) => {
        return options
            .filter(o =>
                o.name.toLowerCase().includes(value.toLowerCase())
                && !selectedTags.some(t => t.name == o.name)) // todo this check does not work - for some reason, selectedTags is always empty
            .slice(0, 10);
    }
    
    return (
        <div>
            <div className="mt-2 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                    <Badge
                        key={tag.name}
                        variant="secondary"
                        className="bg-purple-100 text-purple-700">
                        <span
                            className="mr-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                        >
                          ×
                        </span>
                        {tag.name}
                    </Badge>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
                <Autocomplete
                    fetchSuggestions={fetchSuggestions}
                    onChange={value => addTag(value)}
                />
            </div>
        </div>
    )
}