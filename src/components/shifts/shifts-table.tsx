"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Shift, WorkStation } from "@prisma/client";
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
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  deleteShowcaseShift,
  mergeShifts,
  useShowcaseStoreVersion,
} from "@/lib/showcase-store";

interface ShiftWithRelations extends Shift {
  workStation: WorkStation;
  _count: {
    signups: number;
  };
}

interface ShiftsTableProps {
  shifts: ShiftWithRelations[];
}

export function ShiftsTable({ shifts }: ShiftsTableProps) {
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());
  useShowcaseStoreVersion();
  const data = useMemo(() => {
    const filtered = shifts.filter((shift) => !locallyDeletedIds.has(shift.id));
    return mergeShifts(filtered);
  }, [shifts, locallyDeletedIds]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      const response = await fetch(`/api/shifts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shift");
      }

      setLocallyDeletedIds((prev) => new Set([...prev, id]));
      deleteShowcaseShift(id);
      toast.success("Shift deleted successfully");
    } catch {
      toast.error("Failed to delete shift");
    }
  };

  const columns: ColumnDef<ShiftWithRelations>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/shifts/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      accessorKey: "workStation",
      header: "Station",
      cell: ({ row }) => row.original.workStation.name,
    },
    {
      id: "shiftDate",
      accessorKey: "startTime",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.startTime), "MMM d, yyyy"),
    },
    {
      id: "shiftTime",
      accessorKey: "startTime",
      header: "Time",
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <span className="text-sm">
            {format(new Date(shift.startTime), "h:mm a")} -{" "}
            {format(new Date(shift.endTime), "h:mm a")}
          </span>
        );
      },
    },
    {
      accessorKey: "capacity",
      header: "Signups",
      cell: ({ row }) => {
        const shift = row.original;
        const isFull = shift._count.signups >= shift.capacity;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {shift._count.signups} / {shift.capacity}
            </span>
            {isFull && (
              <Badge variant="secondary" className="text-xs">
                Full
              </Badge>
            )}
          </div>
        );
      },
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
            <Link href={`/dashboard/shifts/${row.original.id}/edit`}>
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
                No shifts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
