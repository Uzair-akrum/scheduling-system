"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay } from "date-fns";
import { Shift, WorkStation } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, MapPin, Clock, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createShowcaseSignup,
  hasShowcaseSignup,
  useShowcaseStoreVersion,
} from "@/lib/showcase-store";
import { isClientShowcaseMode } from "@/lib/showcase";

interface AvailableShift extends Shift {
  workStation: WorkStation;
  _count: {
    signups: number;
  };
  signups: { id: string }[];
  canSignup: boolean;
  missingSkills: string[];
}

export default function BrowseShiftsPage() {
  useShowcaseStoreVersion();
  const [shifts, setShifts] = useState<AvailableShift[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (selectedDate) {
        params.append("date", startOfDay(selectedDate).toISOString());
      }

      const response = await fetch(`/api/shifts/available?${params}`);
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedDate]);

  useEffect(() => {
    fetchShifts();
    fetchCategories();
  }, [fetchShifts]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/stations");
      if (response.ok) {
        const stations = await response.json();
        const uniqueCategories = [
          ...new Set(stations.map((s: WorkStation) => s.category)),
        ];
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSignup = async (shiftId: string) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sign up");
      }

      toast.success("Successfully signed up for shift!");
      if (isClientShowcaseMode()) {
        const shift = shifts.find((item) => item.id === shiftId);
        if (shift) {
          createShowcaseSignup({
            id: `tmp_signup_${shift.id}_${Date.now()}`,
            status: "CONFIRMED",
            occurrenceDate: null,
            createdAt: new Date().toISOString(),
            shift: {
              id: shift.id,
              title: shift.title,
              startTime: new Date(shift.startTime).toISOString(),
              endTime: new Date(shift.endTime).toISOString(),
              workStation: {
                name: shift.workStation.name,
                category: shift.workStation.category,
              },
            },
          });
        }
      }

      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                _count: { signups: shift._count.signups + 1 },
                signups: [{ id: `tmp_${Date.now()}` }],
              }
            : shift
        )
      );
      fetchShifts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign up"
      );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Browse Available Shifts</h1>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Category:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < startOfDay(new Date())}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No available shifts found for the selected criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <CardTitle className="text-lg">{shift.title}</CardTitle>
                <Badge variant="outline">{shift.workStation.category}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(shift.startTime), "EEEE, MMM d, yyyy")}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(shift.startTime), "h:mm a")} -{" "}
                  {format(new Date(shift.endTime), "h:mm a")}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {shift.workStation.name}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {shift._count.signups + (hasShowcaseSignup(shift.id) && shift.signups.length === 0 ? 1 : 0)} / {shift.capacity} spots filled
                </div>

                {shift.signups.length > 0 || hasShowcaseSignup(shift.id) ? (
                  <Button disabled className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Already Signed Up
                  </Button>
                ) : shift.canSignup ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSignup(shift.id)}
                  >
                    Sign Up
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button disabled className="w-full">
                      Skills Required
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Missing: {shift.missingSkills.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
