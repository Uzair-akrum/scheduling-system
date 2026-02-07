import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/my-shifts - Get all shifts the current user is signed up for
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signups = await prisma.shiftSignup.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ["CONFIRMED", "NO_SHOW"],
        },
      },
      include: {
        shift: {
          include: {
            workStation: true,
          },
        },
      },
      orderBy: {
        shift: {
          startTime: "desc",
        },
      },
    });

    return NextResponse.json(signups);
  } catch (error) {
    console.error("Error fetching my shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}
