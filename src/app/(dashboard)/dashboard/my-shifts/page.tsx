"use client";

import { useState, useEffect } from "react";
import { format, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Clock,
  MapPin,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelShowcaseSignup,
  mergeMyShifts,
  useShowcaseStoreVersion,
} from "@/lib/showcase-store";

interface MyShift {
  id: string;
  status: string;
  occurrenceDate: string | null;
  createdAt: string;
  shift: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    workStation: {
      name: string;
      category: string;
    };
  };
}

export default function MyShiftsPage() {
  useShowcaseStoreVersion();
  const [upcomingShifts, setUpcomingShifts] = useState<MyShift[]>([]);
  const [pastShifts, setPastShifts] = useState<MyShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyShifts();
  }, []);

  const fetchMyShifts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/my-shifts");
      if (response.ok) {
        const data = mergeMyShifts(await response.json());
        
        // Split into upcoming and past
        const upcoming: MyShift[] = [];
        const past: MyShift[] = [];
        
        data.forEach((signup: MyShift) => {
          const shiftDate = new Date(signup.shift.endTime);
          if (isPast(shiftDate)) {
            past.push(signup);
          } else {
            upcoming.push(signup);
          }
        });
        
        setUpcomingShifts(upcoming);
        setPastShifts(past);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (shiftId: string, occurrenceDate?: string) => {
    if (!confirm("Are you sure you want to cancel this signup?")) return;

    try {
      const params = new URLSearchParams();
      if (occurrenceDate) {
        params.append("occurrenceDate", occurrenceDate);
      }

      const response = await fetch(
        `/api/shifts/${shiftId}/signups?${params}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel signup");
      }

      const key = `${shiftId}_${occurrenceDate || ""}`;
      cancelShowcaseSignup(key);
      setUpcomingShifts((prev) =>
        prev.filter(
          (signup) =>
            `${signup.shift.id}_${signup.occurrenceDate || ""}` !== key
        )
      );
      setPastShifts((prev) =>
        prev.filter(
          (signup) =>
            `${signup.shift.id}_${signup.occurrenceDate || ""}` !== key
        )
      );
      toast.success("Signup cancelled successfully");
    } catch {
      toast.error("Failed to cancel signup");
    }
  };

  const renderShiftCard = (signup: MyShift, showCancel: boolean) => (
    <Card key={signup.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{signup.shift.title}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {signup.shift.workStation.category}
            </Badge>
          </div>
          {signup.status === "CANCELLED" && (
            <Badge variant="secondary">Cancelled</Badge>
          )}
          {signup.status === "NO_SHOW" && (
            <Badge variant="destructive">No Show</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(signup.shift.startTime), "EEEE, MMM d, yyyy")}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {format(new Date(signup.shift.startTime), "h:mm a")} -{" "}
          {format(new Date(signup.shift.endTime), "h:mm a")}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {signup.shift.workStation.name}
        </div>

        {showCancel && signup.status === "CONFIRMED" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 hover:text-red-700"
            onClick={() =>
              handleCancel(
                signup.shift.id,
                signup.occurrenceDate || undefined
              )
            }
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Signup
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Shifts</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Shifts</h1>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingShifts.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastShifts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingShifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  You have no upcoming shifts.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse available shifts to sign up.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingShifts.map((signup) =>
                renderShiftCard(signup, true)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastShifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No past shifts found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastShifts.map((signup) => renderShiftCard(signup, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
