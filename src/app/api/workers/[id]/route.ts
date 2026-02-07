import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";
import { toStringArray } from "@/lib/string-array";

const workerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "WORKER"]).optional(),
  skills: z.array(z.string()).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/workers/[id] - Get a specific worker
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
    const worker = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        phone: true,
        isActive: true,
        createdAt: true,
        shiftSignups: {
          include: {
            shift: {
              include: {
                workStation: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...worker,
      skills: toStringArray(worker.skills),
    });
  } catch (error) {
    console.error("Error fetching worker:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker" },
      { status: 500 }
    );
  }
}

// PUT /api/workers/[id] - Update a worker
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
    const validated = workerUpdateSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json({
        id,
        ...validated,
        skills: validated.skills || [],
      });
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.password) {
      updateData.hashedPassword = await bcrypt.hash(validated.password, 10);
      delete updateData.password;
    }

    const worker = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        phone: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      ...worker,
      skills: toStringArray(worker.skills),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

// DELETE /api/workers/[id] - Delete a worker
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

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}
