"use client";

import { useState, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { format } from "date-fns";
import { WorkStation } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ShiftDetailPopover } from "./shift-detail-popover";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    shiftId: string;
    workStation: WorkStation;
    capacity: number;
    signupCount: number;
    notes?: string;
    isRecurring: boolean;
    occurrenceDate?: Date;
  };
}

interface ScheduleCalendarProps {
  stations: WorkStation[];
}

const categoryColors: Record<string, string> = {
  Machining: "#3b82f6", // blue
  Welding: "#f97316", // orange
  Assembly: "#22c55e", // green
  Quality: "#8b5cf6", // purple
  default: "#6b7280", // gray
};

export function ScheduleCalendar({ stations }: ScheduleCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [selectedShift, setSelectedShift] = useState<CalendarEvent | null>(
    null
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });
  const isMobile = useIsMobile();

  const fetchEvents = useCallback(
    async (start: Date, end: Date) => {
      try {
        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
        });

        if (selectedStation !== "all") {
          params.append("stationId", selectedStation);
        }

        const response = await fetch(`/api/shifts/calendar?${params}`);
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();

        const calendarEvents: CalendarEvent[] = data.map(
          (event: {
            id: string;
            title: string;
            startTime: string;
            endTime: string;
            shiftId: string;
            workStation: WorkStation;
            capacity: number;
            _count: { signups: number };
            notes?: string;
            isRecurring: boolean;
            occurrenceDate?: string;
          }) => ({
            id: event.id,
            title: `${event.title} (${event._count.signups}/${event.capacity})`,
            start: event.startTime,
            end: event.endTime,
            backgroundColor:
              categoryColors[event.workStation.category] ||
              categoryColors.default,
            borderColor:
              categoryColors[event.workStation.category] ||
              categoryColors.default,
            extendedProps: {
              shiftId: event.shiftId,
              workStation: event.workStation,
              capacity: event.capacity,
              signupCount: event._count.signups,
              notes: event.notes,
              isRecurring: event.isRecurring,
              occurrenceDate: event.occurrenceDate,
            },
          })
        );

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    },
    [selectedStation]
  );

  useEffect(() => {
    fetchEvents(dateRange.start, dateRange.end);
  }, [fetchEvents, dateRange]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedShift(arg.event as unknown as CalendarEvent);
    setIsPopoverOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by Station:</span>
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="All Stations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          {Object.entries(categoryColors).map(
            ([category, color]) =>
              category !== "default" && (
                <div key={category} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {category}
                  </span>
                </div>
              )
          )}
        </div>
      </div>

      <Card className="p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={
            isMobile
              ? {
                  left: "prev,next",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek",
                }
              : {
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }
          }
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          height={isMobile ? "60vh" : "70vh"}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
        />
      </Card>

      <ShiftDetailPopover
        shift={selectedShift}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        onUpdate={() => fetchEvents(dateRange.start, dateRange.end)}
      />
    </div>
  );
}
