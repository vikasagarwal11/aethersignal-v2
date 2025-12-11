"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export interface AnalysisRow {
  case_id: string;
  drug: string;
  event: string;
  serious: boolean;
  outcome?: string | null;
  onset_date?: string | null;
  age?: number | null;
  sex?: string | null;
  region?: string | null;
}

interface AnalysisChartsProps {
  rows: AnalysisRow[];
}

function bucketMonth(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

export const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ rows }) => {
  const { timeSeries, bySex, byRegion, byAgeBucket } = useMemo(() => {
    const tsMap = new Map<string, number>();
    const sexMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    const ageMap = new Map<string, number>();

    const ageBucket = (age?: number | null): string => {
      if (age == null || Number.isNaN(age)) return "Unknown";
      if (age < 18) return "<18";
      if (age < 30) return "18–29";
      if (age < 45) return "30–44";
      if (age < 60) return "45–59";
      if (age < 75) return "60–74";
      return "75+";
    };

    for (const row of rows) {
      // time series
      const bucket = bucketMonth(row.onset_date);
      if (bucket) {
        tsMap.set(bucket, (tsMap.get(bucket) ?? 0) + 1);
      }

      // sex
      const sex = (row.sex || "Unknown").toString();
      sexMap.set(sex, (sexMap.get(sex) ?? 0) + 1);

      // region
      const region = (row.region || "Unknown").toString();
      regionMap.set(region, (regionMap.get(region) ?? 0) + 1);

      // age bucket
      const ab = ageBucket(row.age ?? undefined);
      ageMap.set(ab, (ageMap.get(ab) ?? 0) + 1);
    }

    const timeSeries = Array.from(tsMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([bucket, count]) => ({ bucket, count }));

    const bySex = Array.from(sexMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    const byRegion = Array.from(regionMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    const byAgeBucket = Array.from(ageMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    return { timeSeries, bySex, byRegion, byAgeBucket };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="mt-6 text-xs text-gray-500">
        No rows loaded yet, so charts are empty. Try changing the page size or
        filters.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Trend over time */}
      <section>
        <h3 className="text-sm font-semibold mb-2">Trend over time</h3>
        <div className="w-full h-52 border rounded-md bg-white">
          <ResponsiveContainer>
            <LineChart data={timeSeries}>
              <XAxis dataKey="bucket" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Age distribution */}
      <section>
        <h3 className="text-sm font-semibold mb-2">Distribution by age</h3>
        <div className="w-full h-44 border rounded-md bg-white">
          <ResponsiveContainer>
            <BarChart data={byAgeBucket}>
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Sex distribution & Region distribution side by side */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 border rounded-md bg-white">
          <h3 className="text-sm font-semibold px-3 pt-2">By sex</h3>
          <div className="w-full h-[70%]">
            <ResponsiveContainer>
              <BarChart data={bySex}>
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="h-44 border rounded-md bg-white">
          <h3 className="text-sm font-semibold px-3 pt-2">By region</h3>
          <div className="w-full h-[70%]">
            <ResponsiveContainer>
              <BarChart data={byRegion}>
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

