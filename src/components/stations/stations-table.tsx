"use client";

import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { WorkStation, StationStatus } from "@prisma/client";
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
  deleteShowcaseStation,
  mergeStations,
  useShowcaseStoreVersion,
} from "@/lib/showcase-store";

interface StationWithCount extends WorkStation {
  _count: {
    shifts: number;
  };
}

const statusColors: Record<StationStatus, string> = {
  ACTIVE: "bg-green-500",
  MAINTENANCE: "bg-yellow-500",
  OFFLINE: "bg-red-500",
};

interface StationsTableProps {
  stations: StationWithCount[];
}

export function StationsTable({ stations }: StationsTableProps) {
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  useShowcaseStoreVersion();
  const data = useMemo(() => {
    const filtered = stations
      .filter((station) => !locallyDeletedIds.has(station.id))
      .map((station) => ({
        ...station,
        requiredSkills: toStringArray(station.requiredSkills),
      }));

    return mergeStations(filtered);
  }, [stations, locallyDeletedIds]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this station?")) return;

    try {
      const response = await fetch(`/api/stations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete station");
      }

      setLocallyDeletedIds((prev) => new Set([...prev, id]));
      deleteShowcaseStation(id);
      toast.success("Station deleted successfully");
    } catch {
      toast.error("Failed to delete station");
    }
  };

  const allColumns = useMemo<ColumnDef<StationWithCount>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/stations/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.getValue("name")}
          </Link>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as StationStatus;
          return (
            <Badge className={statusColors[status]}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "_count.shifts",
        header: "Shifts",
        cell: ({ row }) => row.original._count.shifts,
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
              <Link href={`/dashboard/stations/${row.original.id}/edit`}>
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
    ],
    []
  );

  const columns = useMemo(() => {
    if (isMobile) {
      return allColumns.filter((col) => {
        const accessorKey = (col as { accessorKey?: string }).accessorKey;
        return accessorKey !== "location" && accessorKey !== "_count.shifts";
      });
    }
    return allColumns;
  }, [allColumns, isMobile]);

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
                No stations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
