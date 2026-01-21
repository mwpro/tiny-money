import {Calendar} from "@/components/ui/calendar.tsx";
import {useEffect, useState} from "react";
import { pl } from "react-day-picker/locale";

interface MonthPickerProps {
    month: MonthSelection,
    onChange: (month: MonthSelection) => void
}

export interface MonthSelection { 
    year: number;
    month: number;
}
export function MonthPicker({month, onChange}: MonthPickerProps) {
    
    const toMonthSelection = (date: Date): MonthSelection => {
        return ({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        })
    }
    
    const [monthInternal, setMonthInternal] = useState<Date>(new Date(month.year, month.month - 1, 1));

    useEffect(() => {
        setMonthInternal(new Date(month.year, month.month - 1, 1));
    }, [month]);
    
    return (
        <>
            <Calendar
                mode="single"
                disabled={true}
                locale={pl}
                defaultMonth={monthInternal}
                month={monthInternal}
                className={"p-0 bg-transparent"}
                classNames={{
                    month: "gap-0",
                    caption_label: "text-base font-bold"
                }}
                onMonthChange={month => {onChange(toMonthSelection(month)); setMonthInternal(month)}}
                components={{
                    MonthGrid: () => (<div/>),
                }}
        />
        </>
    );
}