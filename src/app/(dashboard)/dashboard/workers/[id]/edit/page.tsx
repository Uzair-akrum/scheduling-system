
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/workers/worker-form";

interface EditWorkerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkerPage({ params }: EditWorkerPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const { id } = await params;
  const worker = await prisma.user.findUnique({
    where: { id },
  });

  if (!worker) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Worker</h1>

      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkerForm worker={worker} isEditing />
        </CardContent>
      </Card>
    </div>
  );
}
