import Link from "next/link";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ShiftDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  const { id } = await params;
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      workStation: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      signups: {
        where: { status: "CONFIRMED" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { signups: true },
      },
    },
  });

  if (!shift) {
    notFound();
  }

  const isFull = shift._count.signups >= shift.capacity;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{shift.title}</h1>
          <p className="text-sm text-muted-foreground">
            {shift.workStation.name} ({shift.workStation.category})
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/shifts/${shift.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href="/dashboard/shifts">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <span className="font-medium">Date:</span>{" "}
            {format(new Date(shift.startTime), "EEEE, MMM d, yyyy")}
          </div>
          <div className="text-sm">
            <span className="font-medium">Time:</span>{" "}
            {format(new Date(shift.startTime), "h:mm a")} -{" "}
            {format(new Date(shift.endTime), "h:mm a")}
          </div>
          <div className="text-sm">
            <span className="font-medium">Capacity:</span> {shift._count.signups} /{" "}
            {shift.capacity}{" "}
            {isFull ? <Badge variant="secondary">Full</Badge> : null}
          </div>
          {shift.notes ? (
            <div className="text-sm">
              <span className="font-medium">Notes:</span> {shift.notes}
            </div>
          ) : null}
          <div className="text-sm text-muted-foreground">
            Created by {shift.createdBy.name || shift.createdBy.email}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmed Signups ({shift.signups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shift.signups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has signed up yet.</p>
          ) : (
            <div className="space-y-2">
              {shift.signups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span className="text-sm">
                    {signup.user.name || signup.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(signup.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
