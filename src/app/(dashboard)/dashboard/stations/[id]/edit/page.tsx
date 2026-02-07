
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StationForm } from "@/components/stations/station-form";

interface EditStationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStationPage({ params }: EditStationPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const { id } = await params;
  const station = await prisma.workStation.findUnique({
    where: { id },
  });

  if (!station) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Station</h1>

      <Card>
        <CardHeader>
          <CardTitle>Station Details</CardTitle>
        </CardHeader>
        <CardContent>
          <StationForm station={station} isEditing />
        </CardContent>
      </Card>
    </div>
  );
}
