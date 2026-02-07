import { NextRequest, NextResponse } from "next/server";

import { startOfDay } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/string-array";

// GET /api/shifts/available - Get available shifts for workers to sign up
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const date = searchParams.get("date");

    // Get user's skills
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { skills: true },
    });

    const userSkills = toStringArray(user?.skills);

    // Build where clause
    const where: Record<string, unknown> = {
      isRecurring: false,
      parentShiftId: null,
      isCancelled: false,
      startTime: {
        gte: date ? new Date(date) : startOfDay(new Date()),
      },
    };

    if (category) {
      where.workStation = {
        category,
      };
    }

    // Get shifts with signup counts
    const shifts = await prisma.shift.findMany({
      where,
      include: {
        workStation: true,
        _count: {
          select: { signups: true },
        },
        signups: {
          where: {
            userId: session.user.id,
            status: "CONFIRMED",
          },
          select: { id: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Filter shifts that aren't full and check skill matching
    const availableShifts = shifts
      .filter((shift) => shift._count.signups < shift.capacity)
      .map((shift) => ({
        ...shift,
        canSignup: toStringArray(shift.workStation.requiredSkills).length === 0 ||
          toStringArray(shift.workStation.requiredSkills).some((skill) =>
            userSkills.includes(skill)
          ),
        missingSkills: toStringArray(shift.workStation.requiredSkills).filter(
          (skill) => !userSkills.includes(skill)
        ),
      }));

    return NextResponse.json(availableShifts);
  } catch (error) {
    console.error("Error fetching available shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch available shifts" },
      { status: 500 }
    );
  }
}
