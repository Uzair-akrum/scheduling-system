import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { previewOccurrences, RecurrenceConfig } from "@/lib/recurrence";

// POST /api/recurring/expand - Preview occurrence dates for a recurrence rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      startTime,
      endTime,
      recurrenceRule,
      recurrenceEnd,
    }: {
      startTime: string;
      endTime: string;
      recurrenceRule: string;
      recurrenceEnd?: string;
    } = body;

    if (!startTime || !endTime || !recurrenceRule) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const occurrences = previewOccurrences(
      new Date(startTime),
      new Date(endTime),
      recurrenceRule,
      recurrenceEnd ? new Date(recurrenceEnd) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      50 // Limit to 50 occurrences for preview
    );

    return NextResponse.json({ occurrences });
  } catch (error) {
    console.error("Error expanding recurrence:", error);
    return NextResponse.json(
      { error: "Failed to expand recurrence" },
      { status: 500 }
    );
  }
}
