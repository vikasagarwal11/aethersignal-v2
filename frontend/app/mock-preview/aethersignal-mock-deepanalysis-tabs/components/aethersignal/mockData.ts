// Mock data for AetherSignal Signals dashboard prototype

export type Trend = "Increasing" | "Stable" | "Decreasing";
export type Severity = "critical" | "high" | "medium";
export type Recommendation = "Escalate" | "Monitor" | "Defer";

export const kpiCards = [
  { label: "Total Cases", value: "12,487", delta: "+12.3% vs last month" },
  { label: "Critical Signals", value: "37", delta: "+4 since yesterday" },
  { label: "Serious Events", value: "624", delta: "+2.1% vs last month" },
  { label: "Products Monitored", value: "86", delta: "Stable" },
] as const;

export const prioritySignals = [
  {
    id: "aspirin_gi_bleeding",
    rank: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal bleeding",
    prr: "15.3",
    cases: 234,
    score: "0.95",
    trend: "Increasing" as const,
    velocity: "+18% WoW",
    confidence: "High",
    recommendation: "Escalate" as const,
    severity: "critical" as const,
  },
  {
    id: "warfarin_internal_hemorrhage",
    rank: 2,
    drug: "Warfarin",
    reaction: "Internal hemorrhage",
    prr: "12.8",
    cases: 189,
    score: "0.92",
    trend: "Stable" as const,
    velocity: "+3% WoW",
    confidence: "High",
    recommendation: "Monitor" as const,
    severity: "critical" as const,
  },
  {
    id: "metformin_lactic_acidosis",
    rank: 3,
    drug: "Metformin",
    reaction: "Lactic acidosis",
    prr: "8.4",
    cases: 156,
    score: "0.85",
    trend: "Increasing" as const,
    velocity: "+9% WoW",
    confidence: "Med",
    recommendation: "Monitor" as const,
    severity: "high" as const,
  },
  {
    id: "lisinopril_angioedema",
    rank: 4,
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: "6.2",
    cases: 98,
    score: "0.78",
    trend: "Stable" as const,
    velocity: "+1% WoW",
    confidence: "Med",
    recommendation: "Defer" as const,
    severity: "high" as const,
  },
  {
    id: "atorvastatin_rhabdo",
    rank: 5,
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: "5.1",
    cases: 67,
    score: "0.71",
    trend: "Decreasing" as const,
    velocity: "-6% WoW",
    confidence: "Med",
    recommendation: "Defer" as const,
    severity: "medium" as const,
  },
] as const;

export type PrioritySignal = (typeof prioritySignals)[number];

export const sessionData = [
  { id: "S-2025-12-11-01", label: "Session 1", timestamp: "11-Dec-2025 09:05:00 UTC", files: 3, cases: 120 },
  { id: "S-2025-12-11-02", label: "Session 2", timestamp: "11-Dec-2025 09:06:00 UTC", files: 4, cases: 127 },
  { id: "S-2025-12-11-03", label: "Session 3", timestamp: "11-Dec-2025 09:07:00 UTC", files: 5, cases: 134 },
  { id: "S-2025-12-11-04", label: "Session 4", timestamp: "11-Dec-2025 09:08:00 UTC", files: 6, cases: 141 },
  { id: "S-2025-12-11-05", label: "Session 5", timestamp: "11-Dec-2025 09:09:00 UTC", files: 7, cases: 148 },
  { id: "S-2025-12-11-06", label: "Session 6", timestamp: "11-Dec-2025 09:10:00 UTC", files: 8, cases: 155 },
] as const;

export const sessionAnalyses = [
  { id: "AN-001", title: "Bleeding risk · Drug 1", type: "AI summary", ts: "11-Dec-2025 09:12:19 UTC" },
  { id: "AN-002", title: "Bleeding risk · Drug 2", type: "AI summary", ts: "11-Dec-2025 09:12:52 UTC" },
  { id: "AN-003", title: "Bleeding risk · Drug 3", type: "AI summary", ts: "11-Dec-2025 09:13:10 UTC" },
] as const;
