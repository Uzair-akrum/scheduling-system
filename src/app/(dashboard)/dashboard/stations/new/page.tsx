
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StationForm } from "@/components/stations/station-form";

export default async function NewStationPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Station</h1>

      <Card>
        <CardHeader>
          <CardTitle>Station Details</CardTitle>
        </CardHeader>
        <CardContent>
          <StationForm />
        </CardContent>
      </Card>
    </div>
  );
}
