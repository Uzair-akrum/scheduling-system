
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkersTable } from "@/components/workers/workers-table";
import { Plus } from "lucide-react";

export default async function WorkersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const workers = await prisma.user.findMany({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workers</h1>
        <Link href="/dashboard/workers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkersTable workers={workers} />
        </CardContent>
      </Card>
    </div>
  );
}
