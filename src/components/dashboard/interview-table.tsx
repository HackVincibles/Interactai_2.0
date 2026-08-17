"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, FileText, Trash2, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { InterviewSession } from "@/lib/types";
const candidates: any[] = [];
const jobs: any[] = [];

interface InterviewTableProps {
  data: InterviewSession[];
}

export function InterviewTable({ data }: InterviewTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const getCandidate = (candidateId: string) => candidates.find((c) => c.id === candidateId);
  const getJob = (jobId: string) => jobs.find((j) => j.id === jobId);

  const getProgress = (interview: InterviewSession) => {
    const rounds = [interview.rounds.hr, interview.rounds.technical, interview.rounds.coding].filter((r): r is NonNullable<typeof r> => r !== undefined && r !== null);
    const completed = rounds.filter((r) => r.status === "completed").length;
    return (completed / rounds.length) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  const columns: ColumnDef<InterviewSession>[] = [
    {
      accessorKey: "candidate",
      header: "Candidate",
      cell: ({ row }) => {
        const candidate = getCandidate(row.original.candidateId);
        const initials = candidate?.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "?";
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 border border-[--color-border]">
              <AvatarFallback className="bg-[--grok-gray-800] text-[--grok-white] text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-[--grok-white]">{candidate?.name ?? "Unknown"}</p>
              <p className="text-xs text-[--grok-gray-400]">{candidate?.email ?? ""}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => {
        const job = getJob(row.original.jobId);
        return <span className="text-sm text-[--grok-white]">{job?.title ?? "—"}</span>;
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = getProgress(row.original);
        const rounds = [
          row.original.rounds.hr,
          row.original.rounds.technical,
          row.original.rounds.coding,
        ].filter((r): r is NonNullable<typeof r> => r !== undefined && r !== null);
        const completed = rounds.filter((r) => r.status === "completed").length;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={progress} className="h-2 w-20" />
            <span className="text-xs text-[--grok-gray-400]">{completed}/{rounds.length}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "hrScore",
      header: "HR",
      cell: ({ row }) => {
        const score = row.original.rounds.hr.score;
        if (score === 0) return <span className="text-xs text-[--grok-gray-400]">—</span>;
        return (
          <Badge variant="outline" className={`${getScoreColor(score)} text-xs`}>
            {score}
          </Badge>
        );
      },
    },
    {
      accessorKey: "techScore",
      header: "Technical",
      cell: ({ row }) => {
        const score = row.original.rounds.technical.score;
        if (score === 0) return <span className="text-xs text-[--grok-gray-400]">—</span>;
        return (
          <Badge variant="outline" className={`${getScoreColor(score)} text-xs`}>
            {score}
          </Badge>
        );
      },
    },
    {
      accessorKey: "codeScore",
      header: "Coding",
      cell: ({ row }) => {
        const score = row.original.rounds.coding?.score ?? 0;
        if (score === 0) return <span className="text-xs text-[--grok-gray-400]">—</span>;
        return (
          <Badge variant="outline" className={`${getScoreColor(score)} text-xs`}>
            {score}
          </Badge>
        );
      },
    },
    {
      accessorKey: "overallScore",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-[--grok-gray-800]"
          >
            Overall
            <ArrowUpDown className="ml-2 size-3 text-[--grok-gray-400]" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const score = row.original.overallScore;
        if (score === 0) return <span className="text-xs text-[--grok-gray-400]">—</span>;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"}`}>
              {score}
            </span>
            <span className="text-xs text-[--grok-gray-400]">/100</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
          "in-progress": "bg-[--grok-accent]/10 text-[--grok-accent] border-[--grok-accent]/30",
          completed: "bg-green-500/10 text-green-500 border-green-500/30",
        };
        return (
          <Badge variant="outline" className={`${statusColors[status]} capitalize`}>
            {status.replace("-", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const interview = row.original;
        // Determine which round to start/continue
        const getNextRound = () => {
          if (interview.rounds.hr.status !== "completed") return "hr";
          if (interview.rounds.technical.status !== "completed") return "technical";
          if (interview.rounds.coding?.status !== "completed") return "coding";
          return null;
        };
        const nextRound = getNextRound();

        return (
          <div className="flex items-center gap-2">
            {/* Primary action: Start/Continue Interview */}
            {interview.status !== "completed" && nextRound && (
              <Button
                size="sm"
                className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-medium"
                asChild
              >
                <Link href={`/interview/${interview.id}/${nextRound}`}>
                  <Video className="size-3 mr-1" />
                  {interview.status === "scheduled" ? "Start" : "Continue"}
                </Link>
              </Button>
            )}
            {/* Dropdown for more options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4 text-[--grok-gray-400]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[--grok-gray-800] border-[--color-border]">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/interviews/${interview.id}/report`} className="cursor-pointer">
                    <Eye className="size-4 mr-2" />
                    View Report
                  </Link>
                </DropdownMenuItem>
                {interview.status !== "completed" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/interview/${interview.id}/hr`} className="cursor-pointer">
                        <Play className="size-4 mr-2" />
                        HR Round
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/interview/${interview.id}/technical`} className="cursor-pointer">
                        <Play className="size-4 mr-2" />
                        Technical Round
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/interview/${interview.id}/coding`} className="cursor-pointer">
                        <Play className="size-4 mr-2" />
                        Coding Round
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem className="text-red-400 cursor-pointer">
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search candidates..."
          value={(table.getColumn("candidate")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("candidate")?.setFilterValue(event.target.value)
          }
          className="max-w-sm border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] placeholder:text-[--grok-gray-400]"
        />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-400] border-[--color-border]">
            {table.getFilteredRowModel().rows.length} interviews
          </Badge>
        </div>
      </div>
      <div className="rounded-lg border border-[--color-border] bg-[--grok-gray-900]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[--color-border] hover:bg-[--grok-gray-800]">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-[--grok-gray-400]">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-[--color-border] hover:bg-[--grok-gray-800]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-[--grok-white]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[--grok-gray-400]">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-[--grok-gray-400]">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} interviews
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] hover:bg-[--grok-gray-700]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] hover:bg-[--grok-accent] hover:text-black"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

