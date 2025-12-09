import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white hover:bg-primary-600",
        secondary:
          "border-transparent bg-gray-700 text-gray-100 hover:bg-gray-600",
        success:
          "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning:
          "border-transparent bg-warning-500 text-white hover:bg-warning-600",
        danger:
          "border-transparent bg-danger-500 text-white hover:bg-danger-600",
        urgent:
          "border-transparent bg-gradient-to-r from-urgent-500 to-urgent-700 text-white",
        quantum:
          "border-transparent bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white",
        outline: "text-gray-300 border-gray-600 hover:bg-gray-800",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  onRemove?: () => void;
}

function Badge({
  className,
  variant,
  size,
  icon,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-white/80 transition-colors"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };

