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
    isSameDay, startOfDay,
    parse
} from 'date-fns';
import { pl } from 'date-fns/locale/pl'
import {dateFormat, monthYearFormat, monthYearNameFormat} from "@/lib/utils.ts";

interface DateRangePickerProps {
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    onChange: (dateFrom: Date | undefined, dateTo: Date | undefined) => void,
    onRangeDescriptionChange: (rangeDescription: string) => void,
    presets: DateRangePreset[],
    monthYearMode: boolean
}

interface DateRangePreset {
    name: string | ((now: Date) => string),
    preset: (now: Date) => { dateFrom: Date | undefined, dateTo: Date | undefined }
}

export const transactionsListPresets: DateRangePreset[] = [
    {
        name: (now) => format(startOfMonth(now), monthYearNameFormat, { locale: pl }),
        preset: (now) => {
            return ({
                dateFrom: startOfMonth(now),
                dateTo: endOfMonth(now)
            });
        }
    },
    {
        name: (now) => format(startOfMonth(subMonths(now, 1)), monthYearNameFormat, { locale: pl }), 
        preset: (now) => {
            return ({
                dateFrom: startOfMonth(subMonths(now, 1)),
                dateTo: endOfMonth(subMonths(now, 1))
            });
        }
    },
    {
        name: (now) => format(startOfMonth(subMonths(now, 2)), monthYearNameFormat, { locale: pl }), 
        preset: (now) => {
            return ({
                dateFrom: startOfMonth(subMonths(now, 2)),
                dateTo: endOfMonth(subMonths(now, 2))
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
    {
        name: "Cały czas", preset: () => {
            return ({
                dateFrom: undefined,
                dateTo: undefined
            });
        }
    },
];

export const reportPresets: DateRangePreset[] = [
    {
        name: "Ostatnie 12 miesięcy", preset: (now) => {
            return ({
                dateFrom: startOfMonth(subMonths(new Date(), 12)),
                dateTo: endOfMonth(now)
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
        name: "Bieżący i poprzedni rok", preset: (now) => {
            return ({
                dateFrom: startOfYear(subYears(now, 1)),
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
        name: "Cały czas", preset: (now) => {
            return ({
                dateFrom: parse("2019-01", "yyyy-MM", new Date()),
                dateTo: endOfMonth(now)
            });
        }
    },
];

function normalizeRangeToStartOfDay(dateFrom: Date | undefined, dateTo: Date | undefined) : [dateFrom: Date | undefined, dateTo: Date | undefined] {
    return [dateFrom ? startOfDay(dateFrom) : undefined, dateTo ? startOfDay(dateTo) : undefined ];
}

export function DateRangePicker({dateFrom, dateTo, onChange, presets, monthYearMode, onRangeDescriptionChange}: DateRangePickerProps) {
    const defaultPreset = presets.find(p => {
        const pValue = p.preset(new Date())
        return pValue.dateFrom == dateFrom && pValue.dateTo == dateTo 
            || (pValue.dateFrom && pValue.dateTo && dateFrom && dateTo && isSameDay(pValue.dateFrom, dateFrom) && isSameDay(pValue.dateTo, dateTo));
    }) ?? undefined;
    const [open, setOpen] = useState(false)
    const [usedPreset, setUsedPreset] = useState<DateRangePreset | undefined>(defaultPreset);
    const [usedPresetInternal, setUsedPresetInternal] = useState<DateRangePreset | undefined>(defaultPreset);
    const [dateFromInternal, setDateFromInternal] = useState<Date | undefined>(usedPresetInternal?.preset(new Date()).dateFrom)
    const [dateToInternal, setDateToInternal] = useState<Date | undefined>(usedPresetInternal?.preset(new Date()).dateTo)
    const [monthFrom, setMonthFrom] = useState<Date>(new Date);
    const [monthTo, setMonthTo] = useState<Date>(new Date);

    useEffect(() => {
        if (usedPreset){
            onRangeDescriptionChange((typeof usedPreset.name === "string" ? usedPreset.name : usedPreset.name(new Date())));
        } else if (dateFrom && dateTo) {
            onRangeDescriptionChange(`${format(dateFrom, monthYearMode ? monthYearFormat : dateFormat)} - ${format(dateTo, monthYearMode ? monthYearFormat : dateFormat)}`);
        } else {
            onRangeDescriptionChange("");
        }
    }, [usedPreset]);

    useEffect(() => {
        setDateFromInternal(dateFrom);
        setDateToInternal(dateTo);
        dateFrom && setMonthFrom(dateFrom);
        dateTo && setMonthTo(dateTo);
    }, [dateFrom, dateTo]);

    const usePreset = (preset: DateRangePreset) => {
        const val = preset.preset(new Date());
        const [dateFrom, dateTo] = normalizeRangeToStartOfDay(val.dateFrom, val.dateTo);
        setDateFromInternal(dateFrom);
        setDateToInternal(dateTo);
        dateFrom && setMonthFrom(dateFrom);
        dateTo && setMonthTo(dateTo);
        setUsedPresetInternal(preset);
        setUsedPreset(preset);
        setOpen(false);
        onChange(dateFrom, dateTo
        );
    };

    const applyCustomRange = () => {
        setOpen(false);
        onChange(...normalizeRangeToStartOfDay(dateFromInternal, dateToInternal));
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
        <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="justify-between font-normal w-full md:w-auto"
                    >
                        {usedPreset ? (typeof usedPreset.name === "string" ? usedPreset.name : usedPreset.name(new Date())) : "Własny zakres"}
                        {dateFrom && dateTo && ` - ${format(dateFrom, monthYearMode ? monthYearFormat : dateFormat)} - ${format(dateTo, monthYearMode ? monthYearFormat : dateFormat)}`}
                        <ChevronDownIcon/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-y-auto max-h-[80svh]" align="start">
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p, i) => <Badge
                                key={i}
                                variant="secondary"
                                className={`${usedPresetInternal && usedPresetInternal.name === p.name ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"} cursor-pointer`}
                                onClick={() => usePreset(p)}>
                                {typeof p.name === "string" ? p.name : p.name(new Date())}
                            </Badge>
                        )}
                        <Badge
                            variant="secondary"
                            className={`${!usedPresetInternal ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"} cursor-pointer`}
                            onClick={() => {
                                setUsedPresetInternal(undefined);
                            }}>
                            Własny zakres
                        </Badge>
                    </div>
                    {!usedPresetInternal && <div>
                        <div className="flex flex-col sm:flex-row pt-5 gap-5">
                            <Calendar
                                className="p-0"
                                mode="single"
                                selected={dateFromInternal}
                                month={monthFrom}
                                onMonthChange={month => {
                                    setMonthFrom(month);
                                    monthYearMode && selectCustomDateFrom(startOfMonth(month));
                                }}
                                captionLayout="dropdown"
                                showOutsideDays={false}
                                onSelect={selectCustomDateFrom}
                                components={monthYearMode ? {
                                    MonthGrid: () => (<div/>),
                                } : undefined}
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
                                onMonthChange={month => {
                                    setMonthTo(month);
                                    monthYearMode && selectCustomDateTo(endOfMonth(month));
                                }}
                                onSelect={selectCustomDateTo}
                                components={monthYearMode ? {
                                    MonthGrid: () => (<div/>),
                                } : undefined}
                            />

                        </div>
                        <Button className="w-full mt-3" onClick={applyCustomRange}>Zastosuj</Button>
                    </div>
                    }
                </PopoverContent>
        </Popover>
    )
}