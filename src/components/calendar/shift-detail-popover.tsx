"use client";

import { format } from "date-fns";
import { WorkStation } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface ShiftDetailPopoverProps {
  shift: {
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ShiftDetailPopover({
  shift,
  isOpen,
  onClose,
  onUpdate,
}: ShiftDetailPopoverProps) {
  if (!shift) return null;

  const {
    workStation,
    capacity,
    signupCount,
    notes,
    isRecurring,
    occurrenceDate,
  } = shift.extendedProps;

  const isFull = signupCount >= capacity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {shift.title}
            {isRecurring && (
              <Badge variant="outline" className="text-xs">
                Recurring
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(shift.start), "EEEE, MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(shift.start), "h:mm a")} -{" "}
              {format(new Date(shift.end), "h:mm a")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {workStation.name}
              {workStation.location && ` - ${workStation.location}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {signupCount} / {capacity} workers assigned
              {isFull && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Full
                </Badge>
              )}
            </span>
          </div>

          {notes && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="font-medium mb-1">Notes</p>
                <p className="text-muted-foreground">{notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/dashboard/shifts/${shift.extendedProps.shiftId}`;
              }}
            >
              View Details
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
