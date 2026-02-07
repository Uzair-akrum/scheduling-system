"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  Settings,
  LayoutDashboard,
  Factory,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("ADMIN" | "SUPERVISOR" | "WORKER")[];
}

const navItems: NavItem[] = [
  {
    title: "Calendar",
    href: "/dashboard",
    icon: Calendar,
    roles: ["ADMIN", "SUPERVISOR", "WORKER"],
  },
  {
    title: "Shifts",
    href: "/dashboard/shifts",
    icon: ClipboardList,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Stations",
    href: "/dashboard/stations",
    icon: Factory,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Workers",
    href: "/dashboard/workers",
    icon: Users,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Browse Shifts",
    href: "/dashboard/browse",
    icon: LayoutDashboard,
    roles: ["WORKER"],
  },
  {
    title: "My Shifts",
    href: "/dashboard/my-shifts",
    icon: ClipboardList,
    roles: ["WORKER"],
  },
];

interface AppSidebarProps {
  userRole: string;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole as "ADMIN" | "SUPERVISOR" | "WORKER")
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6" />
          <span className="font-semibold">Workshop</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
