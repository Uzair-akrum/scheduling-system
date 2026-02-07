import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";
import { toStringArray } from "@/lib/string-array";

const stationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]).optional(),
  requiredSkills: z.array(z.string()).optional(),
});

// GET /api/stations/[id] - Get a specific station
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const station = await prisma.workStation.findUnique({
      where: { id },
      include: {
        shifts: {
          where: {
            isRecurring: false,
            startTime: {
              gte: new Date(),
            },
          },
          orderBy: {
            startTime: "asc",
          },
          take: 5,
        },
        _count: {
          select: { shifts: true },
        },
      },
    });

    if (!station) {
      return NextResponse.json(
        { error: "Station not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...station,
      requiredSkills: toStringArray(station.requiredSkills),
    });
  } catch (error) {
    console.error("Error fetching station:", error);
    return NextResponse.json(
      { error: "Failed to fetch station" },
      { status: 500 }
    );
  }
}

// PUT /api/stations/[id] - Update a station
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = stationUpdateSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json({
        id,
        ...validated,
        requiredSkills: validated.requiredSkills || [],
      });
    }

    const station = await prisma.workStation.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({
      ...station,
      requiredSkills: toStringArray(station.requiredSkills),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating station:", error);
    return NextResponse.json(
      { error: "Failed to update station" },
      { status: 500 }
    );
  }
}

// DELETE /api/stations/[id] - Delete a station
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (isShowcaseMode()) {
      return NextResponse.json({ success: true });
    }

    await prisma.workStation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting station:", error);
    return NextResponse.json(
      { error: "Failed to delete station" },
      { status: 500 }
    );
  }
}
