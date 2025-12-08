import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  shimmer?: boolean;
}

function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-700",
        shimmer && "animate-pulse",
        variant === "text" && "h-4 w-full rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-md",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      {...props}
    />
  );
}

// Preset skeleton patterns
function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-gray-700 bg-gray-800">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonSignalCard() {
  return (
    <div className="space-y-4 p-6 rounded-lg border-l-4 border-l-gray-600 border border-gray-700 bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-gray-700">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function SkeletonKPICard() {
  return (
    <div className="space-y-4 p-6 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonSignalCard, 
  SkeletonTable,
  SkeletonKPICard,
};
