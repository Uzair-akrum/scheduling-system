import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";

const shiftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  workStationId: z.string().min(1, "Work station is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  recurrenceEnd: z.string().optional(),
});

// GET /api/shifts - List all shifts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workStationId = searchParams.get("workStationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {
      isRecurring: false,
      parentShiftId: null,
    };

    if (workStationId) where.workStationId = workStationId;
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        workStation: true,
        _count: {
          select: { signups: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create a new shift
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = shiftSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json(
        {
          id: `tmp_shift_${Date.now()}`,
          ...validated,
          createdById: session.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        title: validated.title,
        workStationId: validated.workStationId,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        capacity: validated.capacity,
        notes: validated.notes,
        isRecurring: validated.isRecurring,
        recurrenceRule: validated.recurrenceRule,
        recurrenceEnd: validated.recurrenceEnd
          ? new Date(validated.recurrenceEnd)
          : null,
        createdById: session.user.id,
      },
      include: {
        workStation: true,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
