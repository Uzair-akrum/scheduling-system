
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Redirect based on role
  if (session.user.role === "WORKER") {
    redirect("/dashboard/browse");
  }

  // For admin/supervisor, show calendar
  redirect("/dashboard/calendar");
}
