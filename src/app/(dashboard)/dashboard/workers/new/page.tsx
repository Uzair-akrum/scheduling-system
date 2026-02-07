
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/workers/worker-form";

export default async function NewWorkerPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Worker</h1>

      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkerForm />
        </CardContent>
      </Card>
    </div>
  );
}
