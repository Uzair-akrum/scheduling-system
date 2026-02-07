"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { WorkStation, StationStatus } from "@prisma/client";
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
import { toast } from "sonner";
import { toStringArray } from "@/lib/string-array";
import {
  createShowcaseStation,
  updateShowcaseStation,
} from "@/lib/showcase-store";
import { isClientShowcaseMode } from "@/lib/showcase";

interface StationFormData {
  name: string;
  description: string;
  category: string;
  capacity: number;
  location: string;
  status: StationStatus;
  requiredSkills: string;
}

interface StationFormProps {
  station?: WorkStation;
  isEditing?: boolean;
}

export function StationForm({ station, isEditing = false }: StationFormProps) {
  const router = useRouter();

  const form = useForm<StationFormData>({
    defaultValues: {
      name: station?.name || "",
      description: station?.description || "",
      category: station?.category || "",
      capacity: station?.capacity || 1,
      location: station?.location || "",
      status: station?.status || "ACTIVE",
      requiredSkills: toStringArray(station?.requiredSkills).join(", "),
    },
  });

  const onSubmit = async (data: StationFormData) => {
    try {
      // Validation
      if (!data.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!data.category.trim()) {
        toast.error("Category is required");
        return;
      }
      if (!data.capacity || data.capacity < 1) {
        toast.error("Capacity must be at least 1");
        return;
      }

      const payload = {
        ...data,
        requiredSkills: data.requiredSkills
          ? data.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const url = isEditing
        ? `/api/stations/${station?.id}`
        : "/api/stations";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save station");
      }

      if (isClientShowcaseMode()) {
        const stationData = {
          name: payload.name,
          description: payload.description || null,
          category: payload.category,
          capacity: payload.capacity,
          location: payload.location || null,
          status: payload.status,
          requiredSkills: payload.requiredSkills,
        };

        if (isEditing && station?.id) {
          updateShowcaseStation(station.id, stationData);
        } else {
          createShowcaseStation(stationData);
        }
      }

      toast.success(isEditing ? "Station updated" : "Station created");
      router.push("/dashboard/stations");
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="CNC Machine A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="Machining, Welding, Assembly..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Equipment details and capabilities..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Bay A, Row 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills</FormLabel>
              <FormControl>
                <Input
                  placeholder="cnc, machining, welding (comma-separated)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit">
            {isEditing ? "Update Station" : "Create Station"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/stations")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
