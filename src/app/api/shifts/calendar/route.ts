import { NextRequest, NextResponse } from "next/server";

import { startOfDay, endOfDay } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOccurrencesInRange } from "@/lib/recurrence";

// GET /api/shifts/calendar - Get calendar events for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const stationId = searchParams.get("stationId");

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const rangeStart = new Date(startParam);
    const rangeEnd = new Date(endParam);

    // Build where clause
    const where: Record<string, unknown> = {
      parentShiftId: null, // Only get parent shifts, not exceptions
    };

    if (stationId) {
      where.workStationId = stationId;
    }

    // Fetch one-time shifts within range
    const oneTimeShifts = await prisma.shift.findMany({
      where: {
        ...where,
        isRecurring: false,
        startTime: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        workStation: true,
        _count: {
          select: { signups: true },
        },
      },
    });

    // Fetch recurring shifts that might have occurrences in range
    const recurringShifts = await prisma.shift.findMany({
      where: {
        ...where,
        isRecurring: true,
        OR: [
          {
            // Recurring shifts that start before or within range
            startTime: {
              lte: rangeEnd,
            },
          },
        ],
      },
      include: {
        workStation: true,
        exceptions: {
          where: {
            occurrenceDate: {
              gte: startOfDay(rangeStart),
              lte: endOfDay(rangeEnd),
            },
          },
        },
        _count: {
          select: { signups: true },
        },
      },
    });

    // Expand recurring shifts into occurrences
    const recurringEvents = [];
    for (const shift of recurringShifts) {
      // Skip if recurrence has ended before range start
      if (shift.recurrenceEnd && shift.recurrenceEnd < rangeStart) {
        continue;
      }

      const occurrences = getOccurrencesInRange(
        shift,
        rangeStart,
        rangeEnd
      );

      for (const occurrence of occurrences) {
        // Check if this occurrence has an exception
        const exception = shift.exceptions.find(
          (e) =>
            e.occurrenceDate.toISOString().split("T")[0] ===
            occurrence.startTime.toISOString().split("T")[0]
        );

        if (exception?.isCancelled) {
          continue; // Skip cancelled occurrences
        }

        recurringEvents.push({
          id: `${shift.id}_${occurrence.startTime.toISOString()}`,
          shiftId: shift.id,
          title: shift.title,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          workStation: shift.workStation,
          capacity: shift.capacity,
          notes: shift.notes,
          isRecurring: true,
          occurrenceDate: occurrence.startTime,
          _count: shift._count,
        });
      }
    }

    // Combine one-time and recurring events
    const events = [
      ...oneTimeShifts.map((shift) => ({
        id: shift.id,
        shiftId: shift.id,
        title: shift.title,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workStation: shift.workStation,
        capacity: shift.capacity,
        notes: shift.notes,
        isRecurring: false,
        _count: shift._count,
      })),
      ...recurringEvents,
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
