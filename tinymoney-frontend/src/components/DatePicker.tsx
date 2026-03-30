import * as React from "react"
import {Calendar} from "@/components/ui/calendar"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {CalendarIcon} from "lucide-react"
import {format, parse} from "date-fns";
import type {RefCallBack} from "react-hook-form";
import {dateFormat} from "@/lib/utils.ts";

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return format(date, dateFormat)
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

interface DatePickerProps {
    value: string,
    placeholder?: string,
    onChange: (date: string) => void,
    ref?: RefCallBack
}

export function DatePicker({value, placeholder, onChange, ref}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        parse(value, dateFormat, new Date())
    )
    const [month, setMonth] = React.useState<Date | undefined>(isValidDate(date) ? date : undefined)

    return (
        <InputGroup>
            <InputGroupInput
                id="date-required"
                value={value}
                placeholder={placeholder}
                ref={ref}
                onChange={(e) => {
                    const date = parse(e.target.value, dateFormat, new Date())
                    onChange(e.target.value)
                    if (isValidDate(date)) {
                        setDate(date)
                        setMonth(date)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
            />
            <InputGroupAddon align="inline-end">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <InputGroupButton
                            id="date-picker"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Select date"
                            tabIndex={-1}
                        >
                            <CalendarIcon/>
                            <span className="sr-only">Select date</span>
                        </InputGroupButton>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="end"
                        alignOffset={-8}
                        sideOffset={10}
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={(date) => {
                                setDate(date)
                                onChange(formatDate(date))
                                setOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </InputGroupAddon>
        </InputGroup>
    )
}
