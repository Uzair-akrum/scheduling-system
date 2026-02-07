import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";
import { toStringArray } from "@/lib/string-array";

const signupSchema = z.object({
  occurrenceDate: z.string().optional(),
});

// GET /api/shifts/[id]/signups - Get all signups for a shift
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
    const { searchParams } = new URL(request.url);
    const occurrenceDate = searchParams.get("occurrenceDate");

    const where: Record<string, unknown> = {
      shiftId: id,
      status: "CONFIRMED",
    };

    if (occurrenceDate) {
      where.occurrenceDate = new Date(occurrenceDate);
    }

    const signups = await prisma.shiftSignup.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      signups.map((signup) => ({
        ...signup,
        user: {
          ...signup.user,
          skills: toStringArray(signup.user.skills),
        },
      }))
    );
  } catch (error) {
    console.error("Error fetching signups:", error);
    return NextResponse.json(
      { error: "Failed to fetch signups" },
      { status: 500 }
    );
  }
}

// POST /api/shifts/[id]/signups - Sign up for a shift
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = signupSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json(
        {
          id: `tmp_signup_${Date.now()}`,
          shiftId: id,
          userId: session.user.id,
          status: "CONFIRMED",
          occurrenceDate: validated.occurrenceDate || null,
          createdAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Get the shift details
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        workStation: true,
        _count: {
          select: { signups: true },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Check if shift is cancelled
    if (shift.isCancelled) {
      return NextResponse.json(
        { error: "This shift has been cancelled" },
        { status: 400 }
      );
    }

    // Check capacity
    if (shift._count.signups >= shift.capacity) {
      return NextResponse.json(
        { error: "This shift is full" },
        { status: 400 }
      );
    }

    // Check if user already signed up
    const existingSignup = await prisma.shiftSignup.findFirst({
      where: {
        shiftId: id,
        userId: session.user.id,
        occurrenceDate: validated.occurrenceDate
          ? new Date(validated.occurrenceDate)
          : null,
        status: "CONFIRMED",
      },
    });

    if (existingSignup) {
      return NextResponse.json(
        { error: "You are already signed up for this shift" },
        { status: 400 }
      );
    }

    // Check for time conflicts
    const occurrenceDate = validated.occurrenceDate
      ? new Date(validated.occurrenceDate)
      : null;

    const conflictWhere: Record<string, unknown> = {
      userId: session.user.id,
      status: "CONFIRMED",
      shift: {
        OR: [
          {
            // Shift starts during the new shift
            startTime: {
              gte: occurrenceDate
                ? new Date(
                    occurrenceDate.setHours(
                      shift.startTime.getHours(),
                      shift.startTime.getMinutes()
                    )
                  )
                : shift.startTime,
              lt: occurrenceDate
                ? new Date(
                    occurrenceDate.setHours(
                      shift.endTime.getHours(),
                      shift.endTime.getMinutes()
                    )
                  )
                : shift.endTime,
            },
          },
          {
            // Shift ends during the new shift
            endTime: {
              gt: occurrenceDate
                ? new Date(
                    occurrenceDate.setHours(
                      shift.startTime.getHours(),
                      shift.startTime.getMinutes()
                    )
                  )
                : shift.startTime,
              lte: occurrenceDate
                ? new Date(
                    occurrenceDate.setHours(
                      shift.endTime.getHours(),
                      shift.endTime.getMinutes()
                    )
                  )
                : shift.endTime,
            },
          },
        ],
      },
    };

    const conflictingSignups = await prisma.shiftSignup.findMany({
      where: conflictWhere,
      include: {
        shift: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (conflictingSignups.length > 0) {
      return NextResponse.json(
        {
          error: "Time conflict",
          conflicts: conflictingSignups.map((s) => ({
            shift: s.shift.title,
            start: s.shift.startTime,
            end: s.shift.endTime,
          })),
        },
        { status: 400 }
      );
    }

    // Check if worker has required skills
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { skills: true },
    });

    const requiredSkills = toStringArray(shift.workStation.requiredSkills);
    const userSkills = toStringArray(user?.skills);
    const missingSkills = requiredSkills.filter(
      (skill) => !userSkills.includes(skill)
    );

    if (missingSkills.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required skills",
          missingSkills,
        },
        { status: 400 }
      );
    }

    // Create the signup
    const signup = await prisma.shiftSignup.create({
      data: {
        shiftId: id,
        userId: session.user.id,
        occurrenceDate: occurrenceDate,
        status: "CONFIRMED",
      },
      include: {
        shift: {
          include: {
            workStation: true,
          },
        },
      },
    });

    return NextResponse.json(signup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating signup:", error);
    return NextResponse.json(
      { error: "Failed to sign up for shift" },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id]/signups - Cancel a signup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const occurrenceDate = searchParams.get("occurrenceDate");

    if (isShowcaseMode()) {
      return NextResponse.json({ success: true });
    }

    // Find the signup
    const where: Record<string, unknown> = {
      shiftId: id,
      userId: session.user.id,
      status: "CONFIRMED",
    };

    if (occurrenceDate) {
      where.occurrenceDate = new Date(occurrenceDate);
    }

    const signup = await prisma.shiftSignup.findFirst({
      where,
    });

    if (!signup) {
      return NextResponse.json(
        { error: "Signup not found" },
        { status: 404 }
      );
    }

    await prisma.shiftSignup.update({
      where: { id: signup.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling signup:", error);
    return NextResponse.json(
      { error: "Failed to cancel signup" },
      { status: 500 }
    );
  }
}
