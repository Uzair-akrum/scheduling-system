import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";
import { toStringArray } from "@/lib/string-array";

const stationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]),
  requiredSkills: z.array(z.string()).default([]),
});

// GET /api/stations - List all stations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const stations = await prisma.workStation.findMany({
      where,
      include: {
        _count: {
          select: { shifts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      stations.map((station) => ({
        ...station,
        requiredSkills: toStringArray(station.requiredSkills),
      }))
    );
  } catch (error) {
    console.error("Error fetching stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}

// POST /api/stations - Create a new station
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = stationSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json(
        {
          id: `tmp_station_${Date.now()}`,
          ...validated,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    const station = await prisma.workStation.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        capacity: validated.capacity,
        location: validated.location,
        status: validated.status,
        requiredSkills: validated.requiredSkills,
      },
    });

    return NextResponse.json(
      {
        ...station,
        requiredSkills: toStringArray(station.requiredSkills),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating station:", error);
    return NextResponse.json(
      { error: "Failed to create station" },
      { status: 500 }
    );
  }
}
