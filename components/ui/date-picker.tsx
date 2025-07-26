"use client";

import * as React from "react";
import { useState } from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
    startYear?: number;
    endYear?: number;
    date: Date | null;
    setDate: (date: Date | null) => void;
    content: string;
}
export function DatePicker({
    startYear = getYear(new Date()) - 100,
    endYear = getYear(new Date()) + 100,
    date,
    setDate,
    content,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );

    const handleMonthChange = (month: string) => {
        let newDate;
        if (date) {
            newDate = setMonth(date, months.indexOf(month));
        } else {
            const now = new Date();
            newDate = new Date(now.getFullYear(), months.indexOf(month), 1);
        }
        setDate(newDate);
    };

    const handleYearChange = (year: string) => {
        let newDate;
        if (date) {
            newDate = setYear(date, parseInt(year));
        } else {
            newDate = new Date(parseInt(year), 0, 1);
        }
        setDate(newDate);
    };

    const handleSelect = (selectedData: Date | undefined) => {
        if (selectedData) {
            setDate(selectedData);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[250px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        format(date, "MMM d, yyyy")
                    ) : (
                        <span>{content}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto z-50">
                <div className="flex justify-between p-2">
                    <Select
                        onValueChange={handleMonthChange}
                        value={date ? months[getMonth(date)] : ""}
                    >
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={handleYearChange}
                        value={date ? getYear(date).toString() : ""}
                    >
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={handleSelect}
                    initialFocus
                    month={date || new Date()}
                    onMonthChange={setDate}
                />
            </PopoverContent>
        </Popover>
    );
}
