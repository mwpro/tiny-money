import {type Control, useWatch} from "react-hook-form";
import {useDebouncedValue} from "@tanstack/react-pacer";
import {useMemo} from "react";
import {Fcal} from "fcal";
import {Button} from "@/components/ui/button.tsx";
import {CheckIcon} from "lucide-react";

interface ParsedDescriptionProps {
    control: Control<WithDescription>,
    onResultClick: (calculatedAmount: Number) => void
}

export interface WithDescription {
    description?: string | undefined
}

export function ParsedDescription({control, onResultClick}: ParsedDescriptionProps) {
    const descriptionWatch = useWatch({control,
        name: "description"});

    const [debouncedDescription] = useDebouncedValue(descriptionWatch, {
        wait: 500
    });

    const parsedDescription = useMemo(() => {
        if (!debouncedDescription)
            return [];

        const fcal = new Fcal();
        return debouncedDescription.split("\n").map((line) => {
            const lineReplaced = line.replaceAll(",", ".");
            try {
                const evaluated = fcal.evaluate(lineReplaced);
                return evaluated.toString();
            } catch (e) {
                return "";
            }
        })
    }, [debouncedDescription]);
    
    if (parsedDescription?.every(l => !l)) {
        return null;
    }
    
    return (
        <div className="px-3 py-2 min-h-16 grow text-base md:text-sm">
            {parsedDescription.map((l, i) => (
                <div key={i} className="flex">
                    { l ? <>
                        <span>{l}</span>
                        <Button size="icon-sm" variant="link" className="h-auto w-auto pl-1.5 text-gray-300 hover:text-gray-700" onClick={e => {
                            e.preventDefault();
                            const parsedNumber = Number(l);
                            onResultClick(parsedNumber);
                        }}><CheckIcon  />
                        </Button>
                    </> : <span>&nbsp;</span>}
                </div>
            ))}
        </div>
    )
}
