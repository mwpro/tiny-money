import {Badge} from "@/components/ui/badge.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {Calendar} from "@/components/ui/calendar.tsx";
import {ChevronDownIcon} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {
    format,
    subDays,
    subMonths,
    subYears,
    endOfMonth,
    startOfMonth,
    endOfYear,
    startOfYear,
    isSameDay
} from 'date-fns';

interface DatePickerProps {
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    onChange: (dateFrom: Date | undefined, dateTo: Date | undefined) => void
}

interface DateRangePreset {
    name: string,
    preset: (now: Date) => { dateFrom: Date, dateTo: Date }
}

const presets: DateRangePreset[] = [
    {
        name: "Bieżący miesiąc", preset: (now) => {
            return ({
                dateFrom: startOfMonth(now),
                dateTo: endOfMonth(now)
            });
        }
    },
    {
        name: "Poprzedni miesiąc", preset: (now) => {
            return ({
                dateFrom: startOfMonth(subMonths(now, 1)),
                dateTo: endOfMonth(subMonths(now, 1))
            });
        }
    },
    {
        name: "Bieżący rok", preset: (now) => {
            return ({
                dateFrom: startOfYear(now),
                dateTo: endOfYear(now)
            });
        }
    },
    {
        name: "Poprzedni rok", preset: (now) => {
            return ({
                dateFrom: startOfYear(subYears(now, 1)),
                dateTo: endOfYear(subYears(now, 1))
            });
        }
    },
    {
        name: "Ostatnie 365 dni", preset: (now) => {
            return ({
                dateFrom: subDays(now, 365),
                dateTo: now
            });
        }
    },
];

export function DatePicker({dateFrom, dateTo, onChange}: DatePickerProps) {
    const defaultPreset = presets.find(p => {
        const pValue = p.preset(new Date())
        return dateFrom && dateTo && isSameDay(pValue.dateFrom, dateFrom) && isSameDay(pValue.dateTo, dateTo);
    }) ?? presets[0];
    const [open, setOpen] = useState(false)
    const [usedPreset, setUsedPreset] = useState<DateRangePreset | undefined>(defaultPreset);
    const [usedPresetInternal, setUsedPresetInternal] = useState<DateRangePreset | undefined>(defaultPreset);
    const [dateFromInternal, setDateFromInternal] = useState<Date | undefined>(usedPresetInternal?.preset(new Date()).dateFrom)
    const [dateToInternal, setDateToInternal] = useState<Date | undefined>(usedPresetInternal?.preset(new Date()).dateTo)
    const [monthFrom, setMonthFrom] = useState<Date>(new Date);
    const [monthTo, setMonthTo] = useState<Date>(new Date);

    useEffect(() => {
        setDateFromInternal(dateFrom);
        setDateToInternal(dateTo);
        dateFrom && setMonthFrom(dateFrom);
        dateTo && setMonthTo(dateTo);
    }, [dateFrom, dateTo]);

    const usePreset = (preset: DateRangePreset) => {
        const val = preset.preset(new Date());
        setDateFromInternal(val.dateFrom);
        setDateToInternal(val.dateTo);
        setMonthFrom(val.dateFrom);
        setMonthTo(val.dateTo);
        setUsedPresetInternal(preset);
        setUsedPreset(preset);
        setOpen(false);
        onChange(val.dateFrom, val.dateTo);
    };

    const applyCustomRange = () => {
        setOpen(false);
        onChange(dateFromInternal, dateToInternal);
        setUsedPreset(undefined);
    };

    const selectCustomDateFrom = (date: Date | undefined) => {
        setDateFromInternal(date)
        if (date && dateToInternal && date > dateToInternal) {
            setDateToInternal(date)
            setMonthTo(date)
        }
        if (date) {
            setUsedPresetInternal(undefined);
        }
    };
    const selectCustomDateTo = (date: Date | undefined) => {
        setDateToInternal(date)
        if (date) {
            setUsedPresetInternal(undefined);
        }
    };
    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="justify-between font-normal"
                    >
                        {usedPreset ? usedPreset.name : "Własny zakres"} -&nbsp;
                        {dateFrom && dateTo ? `${format(dateFrom, 'yyyy-MM-dd')} - ${format(dateTo, 'yyyy-MM-dd')}` : "Wybierz zakres dat"}
                        <ChevronDownIcon/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-lg overflow-hidden" align="start">
                    <div className="flex flex-wrap gap-2">
                        {presets.map(p => <Badge
                                key={p.name}
                                variant="secondary"
                                className={`${usedPresetInternal && usedPresetInternal.name === p.name ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"} cursor-pointer`}
                                onClick={() => usePreset(p)}>
                                {p.name}
                            </Badge>
                        )}
                        <Badge
                            variant="secondary"
                            className={`${!usedPresetInternal ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"} cursor-pointer`}
                            onClick={() => {
                                setUsedPresetInternal(undefined);
                            }}>
                            Własny zakres
                        </Badge>
                    </div>
                    {!usedPresetInternal && <div>
                        <div className="flex pt-5 gap-5">
                            <Calendar
                                className="p-0"
                                mode="single"
                                selected={dateFromInternal}
                                month={monthFrom}
                                onMonthChange={setMonthFrom}
                                captionLayout="dropdown"
                                showOutsideDays={false}
                                onSelect={selectCustomDateFrom}
                            />
                            <Calendar
                                className="p-0"
                                mode="single"
                                selected={dateToInternal}
                                weekStartsOn={1}
                                captionLayout="dropdown"
                                showOutsideDays={false}
                                disabled={dateFromInternal && {before: dateFromInternal}}
                                month={monthTo}
                                onMonthChange={setMonthTo}
                                onSelect={selectCustomDateTo}
                            />

                        </div>
                        <Button className="w-full mt-3" onClick={applyCustomRange}>Zastosuj</Button>
                    </div>
                    }
                </PopoverContent>
            </Popover>
        </div>
    )
}