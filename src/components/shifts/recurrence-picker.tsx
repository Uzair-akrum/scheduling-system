"use client";

import { useState, useEffect } from "react";
import { format, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { buildRRule, RecurrenceConfig } from "@/lib/recurrence";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const daysOfWeek = [
  { id: "MO", label: "Mon" },
  { id: "TU", label: "Tue" },
  { id: "WE", label: "Wed" },
  { id: "TH", label: "Thu" },
  { id: "FR", label: "Fri" },
  { id: "SA", label: "Sat" },
  { id: "SU", label: "Sun" },
];

interface RecurrencePickerProps {
  onChange: (config: { rule: string; endDate?: Date }) => void;
}

export function RecurrencePicker({ onChange }: RecurrencePickerProps) {
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "WEEKLY"
  );
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>(["MO", "TU", "WE", "TH", "FR"]);
  const [endType, setEndType] = useState<"never" | "on" | "after">("on");
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [occurrences, setOccurrences] = useState(10);
  const [preview, setPreview] = useState<Date[]>([]);

  useEffect(() => {
    const config: RecurrenceConfig = {
      frequency,
      interval,
      byDay: frequency === "WEEKLY" ? selectedDays : undefined,
    };

    if (endType === "on") {
      config.until = endDate;
    } else if (endType === "after") {
      config.count = occurrences;
    }

    const rule = buildRRule(config);
    onChange({ rule, endDate: endType === "on" ? endDate : undefined });

    // Generate preview
    try {
      const { rrulestr } = require("rrule");
      const rrule = rrulestr(rule, { dtstart: new Date() });
      const dates = rrule.between(new Date(), addMonths(new Date(), 1), true);
      setPreview(dates.slice(0, 5));
    } catch {
      setPreview([]);
    }
  }, [frequency, interval, selectedDays, endType, endDate, occurrences, onChange]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
      <h4 className="font-medium">Recurrence Pattern</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) =>
              setFrequency(v as "DAILY" | "WEEKLY" | "MONTHLY")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Every</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              {frequency === "DAILY"
                ? "days"
                : frequency === "WEEKLY"
                ? "weeks"
                : "months"}
            </span>
          </div>
        </div>
      </div>

      {frequency === "WEEKLY" && (
        <div className="space-y-2">
          <Label>On days</Label>
          <div className="flex gap-2">
            {daysOfWeek.map((day) => (
              <div key={day.id} className="flex items-center space-x-1">
                <Checkbox
                  id={day.id}
                  checked={selectedDays.includes(day.id)}
                  onCheckedChange={() => toggleDay(day.id)}
                />
                <Label htmlFor={day.id} className="text-xs cursor-pointer">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>End</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="endType"
              value="never"
              checked={endType === "never"}
              onChange={() => setEndType("never")}
            />
            <span className="text-sm">Never</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="endType"
              value="on"
              checked={endType === "on"}
              onChange={() => setEndType("on")}
            />
            <span className="text-sm">On</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  disabled={endType !== "on"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="endType"
              value="after"
              checked={endType === "after"}
              onChange={() => setEndType("after")}
            />
            <span className="text-sm">After</span>
            <Input
              type="number"
              min={1}
              value={occurrences}
              onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
              className="w-20"
              disabled={endType !== "after"}
            />
            <span className="text-sm">occurrences</span>
          </div>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Next occurrences:</p>
          <ul className="list-disc list-inside">
            {preview.map((date, i) => (
              <li key={i}>{format(date, "EEE, MMM d, yyyy")}</li>
            ))}
            {preview.length === 5 && <li>...</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
