
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShiftsTable } from "@/components/shifts/shifts-table";
import { Plus } from "lucide-react";

export default async function ShiftsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const shifts = await prisma.shift.findMany({
    where: {
      isRecurring: false,
      parentShiftId: null,
    },
    include: {
      workStation: true,
      _count: {
        select: { signups: true },
      },
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Shifts</h1>
        <Link href="/dashboard/shifts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftsTable shifts={shifts} />
        </CardContent>
      </Card>
    </div>
  );
}
