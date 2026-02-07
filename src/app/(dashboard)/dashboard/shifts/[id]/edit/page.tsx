
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShiftForm } from "@/components/shifts/shift-form";

interface EditShiftPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditShiftPage({ params }: EditShiftPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const { id } = await params;
  
  const [shift, stations] = await Promise.all([
    prisma.shift.findUnique({
      where: { id },
      include: {
        workStation: true,
      },
    }),
    prisma.workStation.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!shift) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Shift</h1>

      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftForm stations={stations} shift={shift} isEditing />
        </CardContent>
      </Card>
    </div>
  );
}
