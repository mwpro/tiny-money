import {Badge} from "@/components/ui/badge.tsx";
import Autocomplete from "@/components/Autocomplete.tsx";

export interface Option {
    id: number
    name: string
}

interface TagsInputProps {
    options: Option[],
    value: { id?: number; name: string }[],
    onChange: (value: { id?: number; name: string }[]) => void
}

export function TagsInput({options, value, onChange}: TagsInputProps){
    const addTag = (newTag: { id?: number; name: string }) => {
        if (newTag && !value.some(tag => (newTag.id != null && tag.id == newTag.id) || newTag.name == tag.name)) {
            const updatedTags = [...value, newTag];
            //setSelectedTags(updatedTags);
            onChange(updatedTags);
        }
    };

    const removeTag = (tag: { id?: number; name: string }) => {
        const updatedTags = value.filter((c) => c !== tag);
        //setSelectedTags(updatedTags);
        onChange(updatedTags);
    };
    
    const fetchSuggestions = async (input: string) => {
        return options
            .filter(o =>
                o.name.toLowerCase().includes(input.toLowerCase())
                && !value.some(t => t.name == o.name))
            .slice(0, 10);
    }
    
    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {value.map((tag) => (
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
                    fetchSuggestions={fetchSuggestions} clearQueryAfterSelection={true}
                    onChange={value => value && addTag(value)}
                    allowCustomValues={true}
                />
            </div>
        </div>
    )
}