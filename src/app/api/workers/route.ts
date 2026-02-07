import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowcaseMode } from "@/lib/showcase";
import { toStringArray } from "@/lib/string-array";

const workerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "SUPERVISOR", "WORKER"]).default("WORKER"),
  skills: z.array(z.string()).default([]),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/workers - List all workers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (isActive !== null) where.isActive = isActive === "true";

    const workers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { shiftSignups: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      workers.map((worker) => ({
        ...worker,
        skills: toStringArray(worker.skills),
      }))
    );
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

// POST /api/workers - Create a new worker
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = workerSchema.parse(body);

    if (isShowcaseMode()) {
      return NextResponse.json(
        {
          id: `tmp_worker_${Date.now()}`,
          name: validated.name,
          email: validated.email,
          role: validated.role,
          skills: validated.skills,
          phone: validated.phone || null,
          isActive: validated.isActive,
          createdAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const worker = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        hashedPassword,
        role: validated.role,
        skills: validated.skills,
        phone: validated.phone,
        isActive: validated.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ...worker,
        skills: toStringArray(worker.skills),
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
    console.error("Error creating worker:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}
