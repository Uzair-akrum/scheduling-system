"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toStringArray } from "@/lib/string-array";
import {
  deleteShowcaseWorker,
  mergeWorkers,
  useShowcaseStoreVersion,
} from "@/lib/showcase-store";

interface WorkerWithCount {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  skills: unknown;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    shiftSignups: number;
  };
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-500",
  SUPERVISOR: "bg-blue-500",
  WORKER: "bg-green-500",
};

interface WorkersTableProps {
  workers: WorkerWithCount[];
}

export function WorkersTable({ workers }: WorkersTableProps) {
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());
  useShowcaseStoreVersion();
  const data = useMemo(() => {
    const filtered = workers
      .filter((worker) => !locallyDeletedIds.has(worker.id))
      .map((worker) => ({
        ...worker,
        skills: toStringArray(worker.skills),
      }));

    return mergeWorkers(
      filtered
    );
  }, [workers, locallyDeletedIds]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;

    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete worker");
      }

      setLocallyDeletedIds((prev) => new Set([...prev, id]));
      deleteShowcaseWorker(id);
      toast.success("Worker deleted successfully");
    } catch {
      toast.error("Failed to delete worker");
    }
  };

  const columns: ColumnDef<WorkerWithCount>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/workers/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name") || "Unnamed"}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as UserRole;
        return (
          <Badge className={roleColors[role]}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => {
        const skills = row.getValue("skills") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count.shiftSignups",
      header: "Shifts",
      cell: ({ row }) => row.original._count.shiftSignups,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/dashboard/workers/${row.original.id}/edit`}>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No workers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
