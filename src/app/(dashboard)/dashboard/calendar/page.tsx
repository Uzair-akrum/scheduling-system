
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScheduleCalendar } from "@/components/calendar/schedule-calendar";

export default async function CalendarPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const stations = await prisma.workStation.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Schedule Calendar</h1>
      <ScheduleCalendar stations={stations} />
    </div>
  );
}
