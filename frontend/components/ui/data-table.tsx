"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  onSelectionChange?: (selectedRows: T[]) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  virtualScrolling?: boolean;
  maxHeight?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  enableSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = false,
  pageSize = 50,
  onSelectionChange,
  className,
  emptyMessage = "No data available",
  loading = false,
  virtualScrolling = true,
  maxHeight = "600px",
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string | number>>(
    new Set()
  );
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [filterText, setFilterText] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(0);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!enableFiltering || !filterText) return data;

    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor(row);
        return String(value).toLowerCase().includes(filterText.toLowerCase());
      })
    );
  }, [data, filterText, columns, enableFiltering]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!enableSorting || !sortColumn || !sortDirection) return filteredData;

    const column = columns.find((col) => col.id === sortColumn);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = String(column.accessor(a));
      const bValue = String(column.accessor(b));

      const comparison = aValue.localeCompare(bValue, undefined, {
        numeric: true,
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, columns, enableSorting]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!enablePagination) return sortedData;

    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, enablePagination]);

  const displayData = enablePagination ? paginatedData : sortedData;

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    enabled: virtualScrolling && !enablePagination,
  });

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!enableSorting) return;

    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = displayData
        .map((row) => row.id)
        .filter((id): id is string | number => id !== undefined);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = displayData.filter((row) =>
        row.id ? selectedRows.has(row.id) : false
      );
      onSelectionChange(selected);
    }
  }, [selectedRows, displayData, onSelectionChange]);

  // Pagination controls
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < totalPages - 1;

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-primary-500" />;
    }
    return <ArrowDown className="h-4 w-4 text-primary-500" />;
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" />
        <p className="mt-2 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Filter */}
      {enableFiltering && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter data..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="max-w-sm"
          />
          {selectedRows.size > 0 && (
            <span className="text-sm text-gray-400">
              {selectedRows.size} row(s) selected
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            {enableSelection && (
              <div className="px-4 py-3 w-12">
                <Checkbox
                  checked={
                    displayData.length > 0 &&
                    displayData.every((row) =>
                      row.id ? selectedRows.has(row.id) : false
                    )
                  }
                  onCheckedChange={handleSelectAll}
                />
              </div>
            )}
            {columns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider",
                  column.sortable && "cursor-pointer hover:bg-gray-700",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right"
                )}
                style={{ width: column.width || "auto", flex: column.width ? undefined : 1 }}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.id)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: virtualScrolling && !enablePagination ? maxHeight : "auto" }}
        >
          {displayData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">{emptyMessage}</div>
          ) : virtualScrolling && !enablePagination ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = displayData[virtualRow.index];
                const isSelected = row.id ? selectedRows.has(row.id) : false;

                return (
                  <div
                    key={virtualRow.index}
                    className={cn(
                      "absolute top-0 left-0 w-full flex items-center border-b border-gray-800 hover:bg-gray-800 transition-colors",
                      isSelected && "bg-primary-900/20 border-l-2 border-l-primary-500"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {enableSelection && (
                      <div className="px-4 w-12">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            row.id && handleSelectRow(row.id, checked as boolean)
                          }
                        />
                      </div>
                    )}
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className={cn(
                          "px-4 py-3 text-sm text-gray-200",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                        style={{ width: column.width || "auto", flex: column.width ? undefined : 1 }}
                      >
                        {column.accessor(row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            displayData.map((row, index) => {
              const isSelected = row.id ? selectedRows.has(row.id) : false;

              return (
                <div
                  key={row.id || index}
                  className={cn(
                    "flex items-center border-b border-gray-800 hover:bg-gray-800 transition-colors",
                    isSelected && "bg-primary-900/20 border-l-2 border-l-primary-500"
                  )}
                >
                  {enableSelection && (
                    <div className="px-4 py-3 w-12">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          row.id && handleSelectRow(row.id, checked as boolean)
                        }
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div
                      key={column.id}
                      className={cn(
                        "px-4 py-3 text-sm text-gray-200",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                      style={{ width: column.width || "auto", flex: column.width ? undefined : 1 }}
                    >
                      {column.accessor(row)}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {currentPage * pageSize + 1} to{" "}
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={!canPreviousPage}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={!canPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!canNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={!canNextPage}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

