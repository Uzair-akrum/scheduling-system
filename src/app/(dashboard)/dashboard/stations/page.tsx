
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StationsTable } from "@/components/stations/stations-table";
import { Plus } from "lucide-react";

export default async function StationsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const stations = await prisma.workStation.findMany({
    include: {
      _count: {
        select: { shifts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Work Stations</h1>
        <Link href="/dashboard/stations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Station
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stations</CardTitle>
        </CardHeader>
        <CardContent>
          <StationsTable stations={stations} />
        </CardContent>
      </Card>
    </div>
  );
}
