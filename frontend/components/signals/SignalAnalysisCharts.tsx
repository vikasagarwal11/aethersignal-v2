// frontend/components/signals/SignalAnalysisCharts.tsx
"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface TimeBucketCount {
  bucket: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface AnalysisStats {
  total_count: number;
  time_series: TimeBucketCount[];
  by_age_bucket: CategoryCount[];
  by_sex: CategoryCount[];
  by_region: CategoryCount[];
}

interface Props {
  stats: AnalysisStats;
}

export const SignalAnalysisCharts: React.FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-6 mt-4">
      {/* Summary */}
      <div className="p-3 border rounded-lg bg-slate-50 text-xs">
        <div className="font-semibold text-sm mb-1">Summary</div>
        <div>Total cases in this cohort: {stats.total_count}</div>
      </div>

      {/* Trend over time */}
      {stats.time_series.length > 0 && (
        <div className="border rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">
            Trend over time (cases per month)
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.time_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Cases" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Age distribution */}
      {stats.by_age_bucket.length > 0 && (
        <div className="border rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">
            Distribution by age bucket
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_age_bucket}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sex distribution */}
      {stats.by_sex.length > 0 && (
        <div className="border rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">
            Distribution by sex
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_sex}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Region distribution */}
      {stats.by_region.length > 0 && (
        <div className="border rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">
            Distribution by region (top groups)
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_region}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

