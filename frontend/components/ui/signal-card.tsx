import * as React from "react";
import { Card } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";

export interface SignalData {
  id: string;
  drug: string;
  reaction: string;
  prr: number;
  cases: number;
  quantumScore?: number;
  priority: "critical" | "high" | "medium" | "low";
  trending?: "up" | "down" | "stable";
  newCases?: number;
}

export interface SignalCardProps {
  data: SignalData;
  onViewDetails?: () => void;
  onAddToReport?: () => void;
  selected?: boolean;
  className?: string;
}

const priorityConfig = {
  critical: {
    color: "border-l-danger-500",
    bgColor: "bg-danger-500/10",
    icon: "🔴",
    label: "Critical",
    badgeVariant: "danger" as const,
  },
  high: {
    color: "border-l-warning-500",
    bgColor: "bg-warning-500/10",
    icon: "🟡",
    label: "High",
    badgeVariant: "warning" as const,
  },
  medium: {
    color: "border-l-primary-500",
    bgColor: "bg-primary-500/10",
    icon: "🔵",
    label: "Medium",
    badgeVariant: "default" as const,
  },
  low: {
    color: "border-l-gray-600",
    bgColor: "bg-gray-700/10",
    icon: "🟢",
    label: "Low",
    badgeVariant: "secondary" as const,
  },
};

export const SignalCard = React.forwardRef<HTMLDivElement, SignalCardProps>(
  ({ data, onViewDetails, onAddToReport, selected, className }, ref) => {
    const config = priorityConfig[data.priority];

    return (
      <Card
        ref={ref}
        variant="hover"
        padding="none"
        className={cn(
          "border-l-4 overflow-hidden cursor-pointer",
          config.color,
          selected && "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900",
          className
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {data.drug}
                </h3>
                {data.trending === "up" && (
                  <TrendingUp className="h-4 w-4 text-danger-500" />
                )}
              </div>
              <p className="text-base text-gray-300">{data.reaction}</p>
            </div>
            <Badge variant={config.badgeVariant} size="sm">
              {config.icon} {config.label}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {data.prr.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400">PRR</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                {data.cases.toLocaleString()}
                {data.newCases && data.newCases > 0 && (
                  <span className="text-xs text-success-500">
                    +{data.newCases}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Cases
              </div>
            </div>
            {data.quantumScore !== undefined && (
              <div>
                <Badge
                  variant="quantum"
                  size="sm"
                  className="text-white font-bold px-2 py-1"
                >
                  Q: {data.quantumScore.toFixed(2)}
                </Badge>
                <div className="text-xs text-gray-400 mt-1">AI Score</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddToReport}
              className="flex-1"
            >
              Add to Report
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

SignalCard.displayName = "SignalCard";

