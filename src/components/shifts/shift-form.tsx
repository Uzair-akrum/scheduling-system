"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { WorkStation, Shift } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { RecurrencePicker } from "./recurrence-picker";
import {
  createShowcaseShift,
  updateShowcaseShift,
} from "@/lib/showcase-store";
import { isClientShowcaseMode } from "@/lib/showcase";

interface ShiftFormData {
  title: string;
  workStationId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  capacity: number;
  notes: string;
  isRecurring: boolean;
}

interface ShiftFormProps {
  stations: WorkStation[];
  shift?: Shift & { workStation?: WorkStation };
  isEditing?: boolean;
}

export function ShiftForm({
  stations,
  shift,
  isEditing = false,
}: ShiftFormProps) {
  const router = useRouter();
  const [isRecurring, setIsRecurring] = useState(shift?.isRecurring || false);
  const [recurrenceRule, setRecurrenceRule] = useState<string | undefined>(
    shift?.recurrenceRule || undefined
  );
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date | undefined>(
    shift?.recurrenceEnd || undefined
  );

  const form = useForm<ShiftFormData>({
    defaultValues: {
      title: shift?.title || "",
      workStationId: shift?.workStationId || "",
      startDate: shift?.startTime
        ? format(new Date(shift.startTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      startTime: shift?.startTime
        ? format(new Date(shift.startTime), "HH:mm")
        : "08:00",
      endDate: shift?.endTime
        ? format(new Date(shift.endTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      endTime: shift?.endTime
        ? format(new Date(shift.endTime), "HH:mm")
        : "16:00",
      capacity: shift?.capacity || 1,
      notes: shift?.notes || "",
      isRecurring: shift?.isRecurring || false,
    },
  });

  const onSubmit = async (data: ShiftFormData) => {
    try {
      // Validation
      if (!data.title.trim()) {
        toast.error("Title is required");
        return;
      }
      if (!data.workStationId) {
        toast.error("Work station is required");
        return;
      }
      if (!data.capacity || data.capacity < 1) {
        toast.error("Capacity must be at least 1");
        return;
      }

      const startTime = new Date(`${data.startDate}T${data.startTime}`);
      const endTime = new Date(`${data.endDate}T${data.endTime}`);

      if (endTime <= startTime) {
        toast.error("End time must be after start time");
        return;
      }

      const payload = {
        title: data.title,
        workStationId: data.workStationId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: data.capacity,
        notes: data.notes,
        isRecurring: isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
        recurrenceEnd: isRecurring && recurrenceEnd ? recurrenceEnd.toISOString() : null,
      };

      const url = isEditing ? `/api/shifts/${shift?.id}` : "/api/shifts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save shift");
      }

      if (isClientShowcaseMode()) {
        const station = stations.find((item) => item.id === data.workStationId);
        if (station) {
          const shiftData = {
            title: payload.title,
            workStationId: payload.workStationId,
            startTime: payload.startTime,
            endTime: payload.endTime,
            capacity: payload.capacity,
            notes: payload.notes || null,
            isRecurring: payload.isRecurring,
            recurrenceRule: payload.recurrenceRule || null,
            recurrenceEnd: payload.recurrenceEnd || null,
            createdById: shift?.createdById || "showcase-user",
            workStation: {
              id: station.id,
              name: station.name,
              category: station.category,
            },
          };

          if (isEditing && shift?.id) {
            updateShowcaseShift(shift.id, shiftData);
          } else {
            createShowcaseShift(shiftData);
          }
        }
      }

      toast.success(isEditing ? "Shift updated" : "Shift created");
      router.push("/dashboard/shifts");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Morning Shift - CNC Operation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workStationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Station</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a station" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} ({station.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this shift..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={isRecurring}
                      onCheckedChange={(checked) => {
                        setIsRecurring(checked);
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Recurring Shift</FormLabel>
                </FormItem>
              )}
            />

            {isRecurring && (
              <RecurrencePicker
                onChange={({ rule, endDate }) => {
                  setRecurrenceRule(rule);
                  setRecurrenceEnd(endDate);
                }}
              />
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit">
            {isEditing ? "Update Shift" : "Create Shift"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/shifts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
