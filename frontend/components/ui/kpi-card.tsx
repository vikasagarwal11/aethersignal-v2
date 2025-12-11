import * as React from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  trend?: "up" | "down" | "stable";
  icon?: React.ReactNode;
  description?: string;
  sparklineData?: number[];
  className?: string;
  format?: "number" | "currency" | "percentage";
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  (
    {
      title,
      value,
      change,
      trend,
      icon,
      description,
      sparklineData,
      className,
      format = "number",
    },
    ref
  ) => {
    const formatValue = (val: string | number | undefined | null) => {
      // Handle null/undefined values
      if (val === null || val === undefined) return "0";
      if (typeof val === "string") return val;

      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(val);
        case "percentage":
          return `${val}%`;
        default:
          return val.toLocaleString();
      }
    };

    const getTrendColor = () => {
      if (!trend) return "text-gray-400";
      switch (trend) {
        case "up":
          return "text-success-500";
        case "down":
          return "text-danger-500";
        default:
          return "text-gray-400";
      }
    };

    const getTrendIcon = () => {
      if (!trend) return null;
      switch (trend) {
        case "up":
          return <ArrowUp className="h-4 w-4" />;
        case "down":
          return <ArrowDown className="h-4 w-4" />;
        default:
          return <Minus className="h-4 w-4" />;
      }
    };

    return (
      <Card
        ref={ref}
        variant="default"
        padding="sm"
        className={cn("relative overflow-hidden", className)}
      >
        {/* Background gradient for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-50" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {icon && (
                <div className="p-1.5 rounded-lg bg-gray-700/50 text-primary-400">
                  {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
                </div>
              )}
              <h3 className="text-xs font-medium text-gray-400">{title}</h3>
            </div>
          </div>

          {/* Value */}
          <div className="mb-1">
            <div className="text-2xl font-bold text-white">
              {formatValue(value)}
            </div>
          </div>

          {/* Trend and Change */}
          {(change !== undefined || trend) && (
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  getTrendColor()
                )}
              >
                {getTrendIcon() && React.cloneElement(getTrendIcon() as React.ReactElement, { className: "h-3 w-3" })}
                {change !== undefined && (
                  <span>
                    {change > 0 ? "+" : ""}
                    {change}%
                  </span>
                )}
              </div>
              {description && (
                <span className="text-[10px] text-gray-400">{description}</span>
              )}
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-12 mt-4">
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${sparklineData.length * 10} 50`}
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary-500"
                  points={sparklineData
                    .map((val, idx) => {
                      const x = idx * 10;
                      const maxVal = Math.max(...sparklineData);
                      const minVal = Math.min(...sparklineData);
                      const range = maxVal - minVal || 1;
                      const y = 45 - ((val - minVal) / range) * 40;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

KPICard.displayName = "KPICard";

