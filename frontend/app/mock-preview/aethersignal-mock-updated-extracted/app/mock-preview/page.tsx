"use client";

import React, { useState } from "react";

/**
 * AetherSignal Signals Dashboard Redesign Mock
 * - Multi-page shell with top navigation
 * - Compact sessions rail (CFR-style timestamps)
 * - Signals page with KPI row + AI Priority row (5 cards on wide screens)
 * - PRR / Cases / Trend clicks open a centered modal (deep-analysis placeholder)
 * - Right-side AI Assistant rail with fixed input + session analyses tab
 * - Static All Signals table mock
 * - Upload Data button opens a centered upload dialog mock
 */

// ---------- Mock data ----------

const kpiCards = [
  {
    label: "Total Cases",
    value: "12,487",
    delta: "+12.3% vs last month",
  },
  {
    label: "Critical Signals",
    value: "37",
    delta: "+4 since yesterday",
  },
  {
    label: "Serious Events",
    value: "624",
    delta: "+2.1% vs last month",
  },
  {
    label: "Products Monitored",
    value: "86",
    delta: "Stable",
  },
];

type TrendKind = "Increasing" | "Decreasing" | "Stable";

type PrioritySignal = {
  id: string;
  rank: number;
  drug: string;
  reaction: string;
  prr: string;
  cases: number;
  score: string;
  trend: TrendKind;
  severity: "critical" | "high" | "medium";
  velocity: string;
  recommendation: "Escalate" | "Monitor" | "Defer";
};

const prioritySignals: PrioritySignal[] = [
  {
    id: "aspirin-gi-bleeding",
    rank: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal Bleeding",
    prr: "15.3",
    cases: 234,
    score: "0.95",
    trend: "Increasing",
    severity: "critical",
    velocity: "+18% WoW",
    recommendation: "Escalate",
  },
  {
    id: "warfarin-ih",
    rank: 2,
    drug: "Warfarin",
    reaction: "Internal Hemorrhage",
    prr: "12.8",
    cases: 189,
    score: "0.92",
    trend: "Stable",
    severity: "critical",
    velocity: "+2% WoW",
    recommendation: "Monitor",
  },
  {
    id: "metformin-la",
    rank: 3,
    drug: "Metformin",
    reaction: "Lactic Acidosis",
    prr: "8.4",
    cases: 156,
    score: "0.85",
    trend: "Increasing",
    severity: "high",
    velocity: "+11% WoW",
    recommendation: "Monitor",
  },
  {
    id: "lisinopril-angio",
    rank: 4,
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: "6.2",
    cases: 98,
    score: "0.78",
    trend: "Stable",
    severity: "high",
    velocity: "+1% WoW",
    recommendation: "Defer",
  },
  {
    id: "atorva-rhabdo",
    rank: 5,
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: "5.1",
    cases: 67,
    score: "0.71",
    trend: "Decreasing",
    severity: "medium",
    velocity: "-6% WoW",
    recommendation: "Defer",
  },
];

const sessionData = [
  {
    id: "S-2025-12-11-01",
    label: "Session 1",
    timestamp: "2025-12-11 09:05 UTC",
    files: 3,
    cases: 120,
  },
  {
    id: "S-2025-12-11-02",
    label: "Session 2",
    timestamp: "2025-12-11 09:06 UTC",
    files: 4,
    cases: 127,
  },
  {
    id: "S-2025-12-11-03",
    label: "Session 3",
    timestamp: "2025-12-11 09:07 UTC",
    files: 5,
    cases: 134,
  },
  {
    id: "S-2025-12-11-04",
    label: "Session 4",
    timestamp: "2025-12-11 09:08 UTC",
    files: 6,
    cases: 141,
  },
  {
    id: "S-2025-12-11-05",
    label: "Session 5",
    timestamp: "2025-12-11 09:09 UTC",
    files: 7,
    cases: 148,
  },
  {
    id: "S-2025-12-11-06",
    label: "Session 6",
    timestamp: "2025-12-11 09:10 UTC",
    files: 8,
    cases: 155,
  },
  {
    id: "S-2025-12-11-07",
    label: "Session 7",
    timestamp: "2025-12-11 09:15 UTC",
    files: 9,
    cases: 162,
  },
  {
    id: "S-2025-12-11-08",
    label: "Session 8",
    timestamp: "2025-12-11 09:20 UTC",
    files: 10,
    cases: 169,
  },
  {
    id: "S-2025-12-11-09",
    label: "Session 9",
    timestamp: "2025-12-11 09:25 UTC",
    files: 11,
    cases: 176,
  },
  {
    id: "S-2025-12-11-10",
    label: "Session 10",
    timestamp: "2025-12-11 09:30 UTC",
    files: 12,
    cases: 183,
  },
  {
    id: "S-2025-12-11-11",
    label: "Session 11",
    timestamp: "2025-12-11 09:35 UTC",
    files: 13,
    cases: 190,
  },
  {
    id: "S-2025-12-11-12",
    label: "Session 12",
    timestamp: "2025-12-11 09:40 UTC",
    files: 14,
    cases: 197,
  },
  {
    id: "S-2025-12-11-13",
    label: "Session 13",
    timestamp: "2025-12-11 09:45 UTC",
    files: 15,
    cases: 204,
  },
  {
    id: "S-2025-12-11-14",
    label: "Session 14",
    timestamp: "2025-12-11 09:50 UTC",
    files: 16,
    cases: 211,
  },
  {
    id: "S-2025-12-11-15",
    label: "Session 15",
    timestamp: "2025-12-11 09:55 UTC",
    files: 17,
    cases: 218,
  },
  {
    id: "S-2025-12-11-16",
    label: "Session 16",
    timestamp: "2025-12-11 10:00 UTC",
    files: 18,
    cases: 225,
  },
  {
    id: "S-2025-12-11-17",
    label: "Session 17",
    timestamp: "2025-12-11 10:05 UTC",
    files: 19,
    cases: 232,
  },
  {
    id: "S-2025-12-11-18",
    label: "Session 18",
    timestamp: "2025-12-11 10:10 UTC",
    files: 20,
    cases: 239,
  },
  {
    id: "S-2025-12-11-19",
    label: "Session 19",
    timestamp: "2025-12-11 10:15 UTC",
    files: 21,
    cases: 246,
  },
  {
    id: "S-2025-12-11-20",
    label: "Session 20",
    timestamp: "2025-12-11 10:20 UTC",
    files: 22,
    cases: 253,
  },
  {
    id: "S-2025-12-11-21",
    label: "Session 21",
    timestamp: "2025-12-11 10:25 UTC",
    files: 23,
    cases: 260,
  },
  {
    id: "S-2025-12-11-22",
    label: "Session 22",
    timestamp: "2025-12-11 10:30 UTC",
    files: 24,
    cases: 267,
  },
  {
    id: "S-2025-12-11-23",
    label: "Session 23",
    timestamp: "2025-12-11 10:35 UTC",
    files: 25,
    cases: 274,
  },
  {
    id: "S-2025-12-11-24",
    label: "Session 24",
    timestamp: "2025-12-11 10:40 UTC",
    files: 26,
    cases: 281,
  },
  {
    id: "S-2025-12-11-25",
    label: "Session 25",
    timestamp: "2025-12-11 10:45 UTC",
    files: 27,
    cases: 288,
  },
  {
    id: "S-2025-12-11-26",
    label: "Session 26",
    timestamp: "2025-12-11 10:50 UTC",
    files: 28,
    cases: 295,
  },
];

const sessionAnalyses = [
  {
    id: "AN-001",
    title: "Bleeding risk · Drug 1",
    type: "AI summary",
  },
  {
    id: "AN-002",
    title: "Bleeding risk · Drug 2",
    type: "AI summary",
  },
  {
    id: "AN-003",
    title: "Bleeding risk · Drug 3",
    type: "AI summary",
  },
];

const chatMessages = [
  {
    id: "msg-1",
    type: "user",
    text: "Show me serious bleeding events for Drug A in the last 12 months.",
  },
  {
    id: "msg-2",
    type: "assistant",
    text: "I found 37 matching cases across 3 datasets. The disproportionality (PRR 4.8, 95% CI 3.9–5.7) is elevated vs background.",
    hasMenu: true,
  },
  {
    id: "msg-3",
    type: "user",
    text: "What about cardiovascular events for patients over 65?",
  },
  {
    id: "msg-4",
    type: "assistant",
    text: "There are 142 cardiovascular events in patients aged 65+ across FAERS and EudraVigilance. PRR is 3.2 (95% CI 2.8–3.6).",
  },
  {
    id: "msg-5",
    type: "user",
    text: "Compare Drug B and Drug C for hepatic events.",
  },
  {
    id: "msg-6",
    type: "assistant",
    text: "Drug B: 28 hepatic events (PRR 2.4). Drug C: 45 hepatic events (PRR 4.1). Drug C shows stronger signal.",
  },
  {
    id: "msg-7",
    type: "user",
    text: "Show me the trend for Aspirin and gastrointestinal bleeding over the past 6 months.",
  },
  {
    id: "msg-8",
    type: "assistant",
    text: "Aspirin–GI bleeding shows an increasing trend: Q1: 45 cases, Q2: 52 cases, Q3: 61 cases. PRR increased from 12.3 to 15.3.",
  },
  {
    id: "msg-9",
    type: "user",
    text: "What are the most common serious adverse events for anticoagulants?",
  },
  {
    id: "msg-10",
    type: "assistant",
    text: "Top serious AEs for anticoagulants: Hemorrhage (234 cases, PRR 8.2), Thrombocytopenia (89 cases, PRR 3.1), Hepatotoxicity (67 cases, PRR 2.8).",
  },
  {
    id: "msg-11",
    type: "user",
    text: "Filter to show only critical priority signals from the last month.",
  },
  {
    id: "msg-12",
    type: "assistant",
    text: "Found 12 critical priority signals in the last 30 days. Top 3: Warfarin–Hemorrhage (PRR 12.8), Aspirin–GI Bleeding (PRR 15.3), Ticlopidine–Aplastic Anemia (PRR 6.8).",
  },
  {
    id: "msg-13",
    type: "user",
    text: "What's the case count distribution by country for Drug X?",
  },
  {
    id: "msg-14",
    type: "assistant",
    text: "Drug X cases by country: USA (156), Germany (43), UK (28), France (22), Italy (19). Total: 268 cases across 5 countries.",
  },
  {
    id: "msg-15",
    type: "user",
    text: "Show me signals with PRR above 5.0 that appeared in the last quarter.",
  },
  {
    id: "msg-16",
    type: "assistant",
    text: "8 signals with PRR >5.0 in Q3: Metformin–Lactic Acidosis (PRR 8.4), Ciprofloxacin–Tendon Rupture (PRR 5.9), Digoxin–Toxicity (PRR 6.2), and 5 others.",
  },
  {
    id: "msg-17",
    type: "user",
    text: "Compare signal strength between FAERS and EudraVigilance for Drug Y.",
  },
  {
    id: "msg-18",
    type: "assistant",
    text: "Drug Y: FAERS shows PRR 3.4 (89 cases), EudraVigilance shows PRR 2.9 (67 cases). Similar signal strength, slightly higher in FAERS.",
  },
  {
    id: "msg-19",
    type: "user",
    text: "What's the median time to onset for Drug Z adverse events?",
  },
  {
    id: "msg-20",
    type: "assistant",
    text: "For Drug Z, median time to onset is 12 days (IQR: 5–28 days). 65% of events occur within 30 days of first exposure.",
  },
  {
    id: "msg-21",
    type: "user",
    text: "List all drugs associated with Stevens-Johnson syndrome.",
  },
  {
    id: "msg-22",
    type: "assistant",
    text: "Drugs with SJS signals: Lamotrigine (PRR 5.1, 52 cases), Amoxicillin (PRR 2.7, 34 cases), Allopurinol (4 cases, PRR 1.8).",
  },
  {
    id: "msg-23",
    type: "user",
    text: "Show me the correlation between dose and adverse events for Drug Alpha.",
  },
  {
    id: "msg-24",
    type: "assistant",
    text: "Drug Alpha shows dose-dependent relationship: Low dose (50mg): PRR 1.2, Medium (100mg): PRR 2.8, High (200mg): PRR 5.4. Higher doses correlate with stronger signals.",
  },
];

const signalTableRows = [
  {
    id: "row-1",
    drug: "Aspirin",
    reaction: "Gastrointestinal bleeding",
    prr: "15.3",
    cases: 234,
    serious: "Yes",
    priority: "Critical",
  },
  {
    id: "row-2",
    drug: "Warfarin",
    reaction: "Internal hemorrhage",
    prr: "12.8",
    cases: 189,
    serious: "Yes",
    priority: "Critical",
  },
  {
    id: "row-3",
    drug: "Metformin",
    reaction: "Lactic acidosis",
    prr: "8.4",
    cases: 156,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-4",
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: "6.2",
    cases: 98,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-5",
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: "5.1",
    cases: 67,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-6",
    drug: "Drug F",
    reaction: "Some adverse event description",
    prr: "3.9",
    cases: 45,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-7",
    drug: "Ibuprofen",
    reaction: "Acute kidney injury",
    prr: "4.8",
    cases: 123,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-8",
    drug: "Omeprazole",
    reaction: "Clostridium difficile infection",
    prr: "3.2",
    cases: 89,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-9",
    drug: "Amoxicillin",
    reaction: "Stevens-Johnson syndrome",
    prr: "2.7",
    cases: 34,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-10",
    drug: "Paracetamol",
    reaction: "Hepatotoxicity",
    prr: "5.4",
    cases: 156,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-11",
    drug: "Ramipril",
    reaction: "Cough",
    prr: "2.1",
    cases: 78,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-12",
    drug: "Simvastatin",
    reaction: "Myopathy",
    prr: "4.3",
    cases: 112,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-13",
    drug: "Amlodipine",
    reaction: "Peripheral edema",
    prr: "2.9",
    cases: 67,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-14",
    drug: "Levothyroxine",
    reaction: "Atrial fibrillation",
    prr: "3.5",
    cases: 91,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-15",
    drug: "Azithromycin",
    reaction: "QT prolongation",
    prr: "4.1",
    cases: 45,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-16",
    drug: "Fluoxetine",
    reaction: "Serotonin syndrome",
    prr: "3.8",
    cases: 56,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-17",
    drug: "Digoxin",
    reaction: "Digitalis toxicity",
    prr: "6.2",
    cases: 134,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-18",
    drug: "Furosemide",
    reaction: "Hypokalemia",
    prr: "3.6",
    cases: 102,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-19",
    drug: "Metoprolol",
    reaction: "Bradycardia",
    prr: "3.1",
    cases: 73,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-20",
    drug: "Tramadol",
    reaction: "Seizure",
    prr: "4.7",
    cases: 67,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-21",
    drug: "Ciprofloxacin",
    reaction: "Tendon rupture",
    prr: "5.9",
    cases: 89,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-22",
    drug: "Allopurinol",
    reaction: "Drug reaction with eosinophilia",
    prr: "4.2",
    cases: 58,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-23",
    drug: "Carbamazepine",
    reaction: "Hyponatremia",
    prr: "3.4",
    cases: 81,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-24",
    drug: "Vancomycin",
    reaction: "Red man syndrome",
    prr: "2.8",
    cases: 42,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-25",
    drug: "Phenytoin",
    reaction: "Gingival hyperplasia",
    prr: "2.5",
    cases: 39,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-26",
    drug: "Warfarin",
    reaction: "Hemorrhage",
    prr: "7.1",
    cases: 201,
    serious: "Yes",
    priority: "Critical",
  },
  {
    id: "row-27",
    drug: "Lithium",
    reaction: "Lithium toxicity",
    prr: "5.6",
    cases: 67,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-28",
    drug: "Methotrexate",
    reaction: "Pulmonary fibrosis",
    prr: "4.9",
    cases: 54,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-29",
    drug: "Doxycycline",
    reaction: "Photosensitivity",
    prr: "2.3",
    cases: 61,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-30",
    drug: "Spironolactone",
    reaction: "Hyperkalemia",
    prr: "4.5",
    cases: 95,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-31",
    drug: "Hydrochlorothiazide",
    reaction: "Photosensitivity",
    prr: "2.7",
    cases: 48,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-32",
    drug: "Sertraline",
    reaction: "Suicidal ideation",
    prr: "3.9",
    cases: 72,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-33",
    drug: "Clopidogrel",
    reaction: "Thrombotic thrombocytopenic purpura",
    prr: "5.2",
    cases: 83,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-34",
    drug: "Insulin glargine",
    reaction: "Hypoglycemia",
    prr: "4.6",
    cases: 127,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-35",
    drug: "Alendronate",
    reaction: "Atypical femoral fracture",
    prr: "3.7",
    cases: 59,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-36",
    drug: "Rosuvastatin",
    reaction: "Rhabdomyolysis",
    prr: "4.4",
    cases: 76,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-37",
    drug: "Montelukast",
    reaction: "Neuropsychiatric events",
    prr: "3.3",
    cases: 64,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-38",
    drug: "Losartan",
    reaction: "Angioedema",
    prr: "2.6",
    cases: 41,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-39",
    drug: "Pantoprazole",
    reaction: "Bone fracture",
    prr: "3.0",
    cases: 103,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-40",
    drug: "Duloxetine",
    reaction: "Hepatotoxicity",
    prr: "4.0",
    cases: 55,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-41",
    drug: "Ticlopidine",
    reaction: "Aplastic anemia",
    prr: "6.8",
    cases: 38,
    serious: "Yes",
    priority: "Critical",
  },
  {
    id: "row-42",
    drug: "Gabapentin",
    reaction: "Suicidal behavior",
    prr: "3.2",
    cases: 69,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-43",
    drug: "Tolterodine",
    reaction: "Dry mouth",
    prr: "1.8",
    cases: 47,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-44",
    drug: "Quetiapine",
    reaction: "Weight gain",
    prr: "2.4",
    cases: 88,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-45",
    drug: "Lamotrigine",
    reaction: "Stevens-Johnson syndrome",
    prr: "5.1",
    cases: 52,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-46",
    drug: "Terbinafine",
    reaction: "Hepatotoxicity",
    prr: "4.8",
    cases: 43,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-47",
    drug: "Enalapril",
    reaction: "Angioedema",
    prr: "3.6",
    cases: 71,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-48",
    drug: "Prednisolone",
    reaction: "Osteoporosis",
    prr: "3.5",
    cases: 124,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-49",
    drug: "Nifedipine",
    reaction: "Peripheral edema",
    prr: "2.9",
    cases: 66,
    serious: "No",
    priority: "Medium",
  },
  {
    id: "row-50",
    drug: "Pioglitazone",
    reaction: "Bladder cancer",
    prr: "5.5",
    cases: 97,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-51",
    drug: "Olanzapine",
    reaction: "Metabolic syndrome",
    prr: "3.8",
    cases: 105,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-52",
    drug: "Bisoprolol",
    reaction: "Bradycardia",
    prr: "2.7",
    cases: 53,
    serious: "Yes",
    priority: "Medium",
  },
  {
    id: "row-53",
    drug: "Levofloxacin",
    reaction: "Tendonitis",
    prr: "4.2",
    cases: 62,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-54",
    drug: "Cyclosporine",
    reaction: "Nephrotoxicity",
    prr: "6.5",
    cases: 79,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-55",
    drug: "Amitriptyline",
    reaction: "Cardiac arrhythmia",
    prr: "4.1",
    cases: 58,
    serious: "Yes",
    priority: "High",
  },
  {
    id: "row-56",
    drug: "Pregabalin",
    reaction: "Peripheral edema",
    prr: "2.5",
    cases: 84,
    serious: "No",
    priority: "Medium",
  },
];

type PageKey = "dashboard" | "signals" | "analyses" | "settings";
type MetricKind = "PRR" | "Cases" | "Trend";
type ChatTab = "assistant" | "analyses";

type MetricDetail = {
  metric: MetricKind;
  signal: PrioritySignal;
} | null;

// ---------- Small components ----------

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "red" | "amber" | "emerald" | "blue";
}) {
  const cls =
    tone === "red"
      ? "bg-red-500/10 text-red-200 border-red-500/60"
      : tone === "amber"
      ? "bg-amber-500/10 text-amber-200 border-amber-500/60"
      : tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/60"
      : tone === "blue"
      ? "bg-blue-500/10 text-blue-200 border-blue-500/60"
      : "bg-gray-800 text-gray-300 border-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function NavPill({
  label,
  page,
  active,
  onClick,
}: {
  label: string;
  page: PageKey;
  active: boolean;
  onClick: (page: PageKey) => void;
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={[
        "px-2 py-1 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-blue-500/10 text-blue-400 border border-blue-500/40"
          : "text-gray-400 hover:text-gray-100 hover:bg-gray-800 border border-transparent",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MetricModal({
  detail,
  onClose,
}: {
  detail: MetricDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;
  const { metric, signal } = detail;

  const metricValue =
    metric === "PRR"
      ? signal.prr
      : metric === "Cases"
      ? signal.cases
      : signal.trend;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-xl rounded-2xl border border-blue-500/50 bg-[#060910] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-blue-200 mb-1">
              {metric} drill-down
            </div>
            <div className="text-sm font-semibold text-gray-50">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip tone="blue">Metric: {metric} = {metricValue}</Chip>
              <Chip tone="amber">Velocity: {signal.velocity}</Chip>
              <Chip tone={signal.recommendation === "Escalate" ? "red" : signal.recommendation === "Monitor" ? "amber" : "neutral"}>
                Recommendation: {signal.recommendation}
              </Chip>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          In the real application, this interaction would open a dedicated
          analysis view for this drug–event pair (PRR timeline, case listing, or
          trend analysis). This modal is a prototype to show where that
          deep-analysis experience would live.
        </p>
        <div className="mt-4 flex justify-end gap-2 text-[11px]">
          <button
            className="rounded-full border border-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </button>
          <button className="rounded-full bg-blue-500 px-3 py-1 font-semibold text-white hover:bg-blue-400">
            Open full analysis (mock)
          </button>
        </div>
      </div>
    </div>
  );
}

function DeepAnalysisModal({
  signal,
  onClose,
}: {
  signal: PrioritySignal | null;
  onClose: () => void;
}) {
  if (!signal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl border border-red-500/35 bg-[#05060A] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-red-200">Deep analysis view (mock)</div>
            <div className="text-sm font-semibold text-gray-50 mt-0.5">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip tone="red">PRR {signal.prr}</Chip>
              <Chip tone="neutral">{signal.cases} cases</Chip>
              <Chip tone="emerald">Trend: {signal.trend}</Chip>
              <Chip tone="amber">Velocity: {signal.velocity}</Chip>
              <Chip tone={signal.recommendation === "Escalate" ? "red" : signal.recommendation === "Monitor" ? "amber" : "neutral"}>
                {signal.recommendation}
              </Chip>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-3 gap-3 text-[11px]">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="text-[10px] font-semibold text-gray-300 mb-1">Trajectory</div>
            <div className="text-gray-400">Direction, velocity, confidence bands.</div>
            <div className="mt-2 h-24 rounded-lg border border-gray-800 bg-gray-950/50 flex items-center justify-center text-[10px] text-gray-500">
              Timeline chart placeholder
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="text-[10px] font-semibold text-gray-300 mb-1">Decision support</div>
            <div className="text-gray-400">Recommended next steps for analysts/leads.</div>
            <div className="mt-2 flex flex-col gap-2">
              <button className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-semibold text-white hover:bg-blue-400">
                Generate briefing (mock)
              </button>
              <button className="rounded-full border border-gray-700 px-3 py-1 text-[10px] text-gray-200 hover:bg-gray-800">
                Assign reviewer (mock)
              </button>
              <button className="rounded-full border border-gray-700 px-3 py-1 text-[10px] text-gray-200 hover:bg-gray-800">
                Open cases (mock)
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="text-[10px] font-semibold text-gray-300 mb-1">Inspection-proof</div>
            <div className="text-gray-400">Evidence, logic, provenance, audit trail.</div>
            <div className="mt-2 rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-[10px] text-gray-500">
              Evidence pack placeholder (sources + rationale + audit)
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex justify-end gap-2 text-[11px]">
          <button onClick={onClose} className="rounded-full border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800">
            Close
          </button>
          <button className="rounded-full bg-red-500/20 border border-red-500/60 px-3 py-1 text-red-100 hover:bg-red-500/30">
            Export report (mock)
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineDrilldownBar({
  kind,
  signal,
  onClose,
}: {
  kind: "card" | MetricKind;
  signal: PrioritySignal | null;
  onClose: () => void;
}) {
  if (!signal) return null;
  const label =
    kind === "card"
      ? "Selected signal"
      : kind === "PRR"
      ? "PRR drill-down"
      : kind === "Cases"
      ? "Cases drill-down"
      : "Trend drill-down";

  return (
    <div className="mt-2 rounded-xl border border-gray-800 bg-gray-950/85 px-3 py-2 text-[11px] text-gray-200 flex items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-semibold text-gray-300">{label}</div>
        <div className="mt-0.5 text-[11px] text-gray-100">
          <span className="font-semibold">{signal.drug}</span> · {signal.reaction}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Chip tone="red">PRR {signal.prr}</Chip>
          <Chip tone="neutral">{signal.cases} cases</Chip>
          <Chip tone="emerald">{signal.trend}</Chip>
          <Chip tone="amber">{signal.velocity}</Chip>
          <Chip tone={signal.recommendation === "Escalate" ? "red" : signal.recommendation === "Monitor" ? "amber" : "neutral"}>
            {signal.recommendation}
          </Chip>
          <Chip tone="blue">Deep analysis via modal</Chip>
        </div>
      </div>
      <button
        className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
        onClick={onClose}
        aria-label="Dismiss drill-down"
      >
        ✕
      </button>
    </div>
  );
}

function UploadDialogMock({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-500/40 bg-[#060910] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-blue-200">
              Upload data – any format
            </div>
            <div className="mt-0.5 text-[11px] text-gray-400 max-w-lg">
              Drop spontaneous reports, literature PDFs, emails, spreadsheets or
              ZIP bundles. The AI pipeline will extract entities, auto-code to
              MedDRA and create cases for this organization.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[2fr,1.4fr]">
          {/* Drop zone */}
          <div>
            <div className="rounded-xl border border-dashed border-blue-500/60 bg-[#050712] px-4 py-6 text-center">
              <div className="text-2xl mb-1">⬆️</div>
              <div className="text-[11px] font-semibold text-gray-100">
                Drag &amp; drop files here
              </div>
              <div className="mt-1 text-[11px] text-gray-400">
                or{" "}
                <span className="text-blue-300 underline underline-offset-2">
                  browse from device
                </span>
              </div>
              <div className="mt-2 text-[10px] text-gray-500">
                Supported: PDF, DOCX, XLSX/CSV, EML, ZIP, JSON, image scans
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-[#262A33] bg-[#090C14] px-3 py-2">
              <div className="text-[11px] font-semibold text-gray-200 mb-1">
                Example files (mock)
              </div>
              <ul className="space-y-1 text-[11px] text-gray-300">
                <li>• FAERS_Q3_2025.zip</li>
                <li>• EudraVigilance_exports_2025-10-12.xlsx</li>
                <li>• Case_emails_Brazil_2025-11.eml</li>
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-[#262A33] bg-[#090C14] px-3 py-2 text-[11px] text-gray-200">
            <div className="font-semibold mb-1.5">Processing steps (mock)</div>
            <ol className="space-y-1 text-[11px] text-gray-300 list-decimal list-inside">
              <li>Extract raw text from each file.</li>
              <li>Use AI to detect drugs, events, reporters and dates.</li>
              <li>Auto-code events and drugs to MedDRA / WHODrug.</li>
              <li>De-duplicate and link to existing products.</li>
              <li>Generate cases and update signal metrics.</li>
            </ol>
            <div className="mt-3 text-[10px] text-gray-500">
              In the real product this dialog would show upload progress, per-file
              status and ingestion logs for Part 11 auditability.
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 text-[11px]">
          <button
            className="rounded-full border border-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="rounded-full bg-blue-500 px-4 py-1 font-semibold text-white hover:bg-blue-400">
            Start processing (mock)
          </button>
        </div>
      </div>
    </div>
  );
}


function DeepAnalysisModal({
  signal,
  activeTab,
  onTab,
  onClose,
}: {
  signal: PrioritySignal | null;
  activeTab: "Trajectory" | "Cases" | "Evidence" | "Audit";
  onTab: (t: "Trajectory" | "Cases" | "Evidence" | "Audit") => void;
  onClose: () => void;
}) {
  if (!signal) return null;

  const tabs: Array<"Trajectory" | "Cases" | "Evidence" | "Audit"> = [
    "Trajectory",
    "Cases",
    "Evidence",
    "Audit",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-4xl rounded-2xl border border-red-500/35 bg-[#05060A] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#262A33] flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-red-200">
              Deep analysis (mock)
            </div>
            <div className="text-sm font-semibold text-gray-50 mt-0.5">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              Trajectory, cases, evidence, and audit — inspection-proof output.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="inline-flex rounded-full bg-[#0B0F19] border border-[#262A33] p-1 text-[11px] font-medium text-gray-300">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTab(t)}
                className={[
                  "px-3 py-1 rounded-full transition",
                  activeTab === t
                    ? "bg-gray-800 text-gray-100"
                    : "text-gray-400 hover:text-gray-100",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          {activeTab === "Trajectory" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
                <div className="text-[10px] font-semibold text-gray-300 mb-1">
                  Direction & velocity
                </div>
                <div className="mt-2 h-28 rounded-lg border border-[#262A33] bg-[#0F1115] flex items-center justify-center text-[10px] text-gray-500">
                  Timeline chart placeholder
                </div>
              </div>
              <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
                <div className="text-[10px] font-semibold text-gray-300 mb-1">
                  Confidence band
                </div>
                <div className="mt-2 h-28 rounded-lg border border-[#262A33] bg-[#0F1115] flex items-center justify-center text-[10px] text-gray-500">
                  CI / uncertainty placeholder
                </div>
              </div>
              <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
                <div className="text-[10px] font-semibold text-gray-300 mb-1">
                  Next actions
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <button className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-400">
                    Generate briefing (mock)
                  </button>
                  <button className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200 hover:bg-gray-800">
                    Assign reviewer (mock)
                  </button>
                  <button className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200 hover:bg-gray-800">
                    Open case listing (mock)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Cases" && (
            <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
              <div className="text-[10px] font-semibold text-gray-300 mb-1">
                Case listing (placeholder)
              </div>
              <div className="mt-2 h-44 rounded-lg border border-[#262A33] bg-[#0F1115] flex items-center justify-center text-[10px] text-gray-500">
                Case table placeholder
              </div>
            </div>
          )}

          {activeTab === "Evidence" && (
            <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
              <div className="text-[10px] font-semibold text-gray-300 mb-1">
                Evidence & sources (placeholder)
              </div>
              <div className="mt-2 h-44 rounded-lg border border-[#262A33] bg-[#0F1115] flex items-center justify-center text-[10px] text-gray-500">
                Evidence pack placeholder
              </div>
            </div>
          )}

          {activeTab === "Audit" && (
            <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] p-3">
              <div className="text-[10px] font-semibold text-gray-300 mb-1">
                Audit trail (placeholder)
              </div>
              <div className="mt-2 h-44 rounded-lg border border-[#262A33] bg-[#0F1115] flex items-center justify-center text-[10px] text-gray-500">
                CFR Part 11 log placeholder
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#262A33] flex items-center justify-between">
          <div className="text-[10px] text-gray-500">
            Mock only — card clicks route here in the final product.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200 hover:bg-gray-800"
            >
              Close
            </button>
            <button className="rounded-full border border-red-500/60 bg-red-500/10 px-3 py-1 text-[11px] text-red-100 hover:bg-red-500/20">
              Export report (mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN APP SHELL ----------

export default function MockPreviewPage() {
  const [activePage, setActivePage] = useState<PageKey>("signals");
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-gray-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-gray-800 bg-gray-950/90 backdrop-blur flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">
            AS
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">AetherSignal</div>
            <div className="text-[11px] text-gray-400">
              AI-powered pharmacovigilance
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavPill
              label="Dashboard"
              page="dashboard"
              active={activePage === "dashboard"}
              onClick={setActivePage}
            />
            <NavPill
              label="Signals"
              page="signals"
              active={activePage === "signals"}
              onClick={setActivePage}
            />
            <NavPill
              label="Analyses"
              page="analyses"
              active={activePage === "analyses"}
              onClick={setActivePage}
            />
            <NavPill
              label="Settings"
              page="settings"
              active={activePage === "settings"}
              onClick={setActivePage}
            />
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800">
            Export
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)] hover:bg-blue-400"
            onClick={() => setShowUpload(true)}
          >
            Upload data
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-semibold">
            AR
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      {activePage === "signals" && <SignalsPageMock />}
      {activePage === "dashboard" && <DashboardPageMock />}
      {activePage === "analyses" && <AnalysesPageMock />}
      {activePage === "settings" && <SettingsPageMock />}

      {/* Upload dialog */}
      <UploadDialogMock open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}

// ---------- SIGNALS PAGE ----------

function SignalsPageMock() {
  const [metricDetail, setMetricDetail] = useState<MetricDetail | null>(null);
  const [deepSignal, setDeepSignal] = useState<PrioritySignal | null>(null);
  const [deepTab, setDeepTab] = useState<"Trajectory" | "Cases" | "Evidence" | "Audit">("Trajectory");
  const [showPriority, setShowPriority] = useState(true);
  const [deepSignal, setDeepSignal] = useState<PrioritySignal | null>(null);
  const [selectedForInline, setSelectedForInline] = useState<{ kind: "card" | MetricKind; signal: PrioritySignal } | null>(null);
  const [chatTab, setChatTab] = useState<ChatTab>("assistant");
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [lastAction, setLastAction] = useState<
    "none" | "generated" | "adjusted"
  >("none");

  const handleMetricClick = (metric: MetricKind, signal: PrioritySignal) => {
    setMetricDetail({ metric, signal });
    setSelectedForInline({ kind: metric, signal });
  };

  const handleCardClick = (signal: PrioritySignal) => {
    // Real app: router.push(`/signals/analysis/${signal.id}`)
    // Wireframe: open the deep analysis modal with tabbed layout
    setDeepSignal(signal);
    setDeepTab("Trajectory");
  };

  const handleViewInterpretation = () => {
    setShowInterpretation((prev) => !prev);
    setChatMenuOpen(false);
  };

  const handleConfirmGenerate = () => {
    setLastAction("generated");
    setChatMenuOpen(false);
  };

  const handleAdjustFilters = () => {
    setLastAction("adjusted");
    setChatMenuOpen(false);
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT RAIL: Sessions */}
      <aside className="w-68 border-r border-gray-800 bg-gray-950/95 backdrop-blur flex flex-col text-[11px]">
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-800 flex items-center justify-between">
          <div className="font-semibold uppercase tracking-[0.12em] text-gray-400">
            Context
          </div>
          <button className="text-[10px] text-gray-400 hover:text-gray-200">
            Refresh
          </button>
        </div>

        <div className="px-3 pt-2">
          <div className="inline-flex rounded-full bg-gray-900 p-1 font-medium text-gray-300">
            <button className="px-2 py-0.5 rounded-full bg-gray-800 text-[11px]">
              Sessions
            </button>
            <button className="px-2 py-0.5 rounded-full text-[11px] text-gray-400 hover:text-gray-100">
              Saved
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="mt-2.5 mb-1.5 text-[10px] font-semibold text-gray-400">
            Recent sessions
          </div>
          <div className="space-y-1.5">
            {sessionData.map((s, idx) => (
              <button
                key={s.id}
                className={[
                  "w-full rounded-lg border px-2.5 py-1.5 text-left transition flex flex-col gap-0.5",
                    idx === 0
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-gray-800 bg-gray-900/60 hover:bg-gray-900",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-100 truncate">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {s.timestamp}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  {s.files} files · {s.cases} cases
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 px-3 py-1.5 text-[10px] text-gray-400 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-200 text-[11px]">
              Current view
            </div>
            <div>All sessions · Org scope</div>
          </div>
          <div className="text-right">
            <div>Cases: 12.4k</div>
            <div>Signals: 932</div>
          </div>
        </div>
      </aside>

      {/* CENTER WORKBENCH */}
      <main className="flex-1 flex flex-col border-x border-gray-800 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 text-[13px] overflow-y-auto">
        {/* Top strip */}
        <section className="px-4 lg:px-6 pt-2 pb-1.5 border-b border-gray-900/70 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Org: <span className="font-medium">Global Safety</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Dataset: <span className="font-medium">FAERS + EudraVigilance</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Scope: <span className="font-medium">Organization</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-1 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-gray-600 bg-gray-900"
              />
              Serious only
            </label>
            <button className="text-gray-400 hover:text-gray-100 underline decoration-dotted underline-offset-4">
              Clear filters
            </button>
          </div>
        </section>

        {/* KPI row */}
        <section className="px-4 lg:px-6 pt-1.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-1.5">
            Today's Safety Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 px-3 py-2 shadow-sm"
              >
                <div className="text-[10px] font-medium text-gray-400 mb-0.5">
                  {kpi.label}
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold tracking-tight text-gray-50">
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/50">
                    {kpi.delta}
                  </div>
                </div>
                <div className="mt-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Priority Signals */}
        <section className="px-4 lg:px-6 mt-2">
          <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-500/10 via-gray-900 to-gray-900 px-3.5 py-2 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-200 border border-red-500/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                  AI Priority Signals
                </div>
                <p className="mt-1 text-[10px] text-gray-200 max-w-xl">
                  Highest-risk drug–event combinations ranked by AI confidence,
                  disproportionality, and temporal patterns. Review these first.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-gray-900/80 border border-gray-700 px-2 py-0.5 text-gray-200">
                  5 critical · 12 high
                </span>
                <button className="rounded-full border border-red-500/60 px-2.5 py-0.5 text-[10px] font-medium text-red-100 hover:bg-red-500/20">
                  View all critical
                </button>
                <button
                  type="button"
                  onClick={() => setShowPriority((v) => !v)}
                  className="rounded-full border border-gray-700 bg-gray-900 px-2.5 py-0.5 text-[10px] text-gray-200 hover:bg-gray-800"
                >
                  {showPriority ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {showPriority && (


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {prioritySignals.map((sig) => (
                <div
                  key={sig.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(sig)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(sig);
                    }
                  }}
                  className="text-left rounded-xl border border-red-500/40 bg-gray-950/70 px-3 py-1.5 text-[10px] flex flex-col gap-1.5 hover:border-red-500/50 hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-100 truncate text-[11px]">
                        {sig.drug}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {sig.reaction}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Chip tone="amber">{sig.velocity}</Chip>
                        <Chip tone={sig.recommendation === "Escalate" ? "red" : sig.recommendation === "Monitor" ? "amber" : "neutral"}>
                          {sig.recommendation}
                        </Chip>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        {Math.round(parseFloat(sig.score) * 100)}% AI
                      </span>
                      <span className="rounded-full border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[9px] uppercase text-gray-300">
                        Rank #{sig.rank}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-300">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("PRR", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-100 border border-red-500/50"
                    >
                      <span className="text-[9px] uppercase text-red-200/80">PRR</span>
                      <span className="font-semibold">{sig.prr}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("Cases", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] text-gray-100 border border-gray-700"
                    >
                      <span className="text-[9px] uppercase text-gray-400">Cases</span>
                      <span className="font-semibold">{sig.cases}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("Trend", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200 border border-emerald-500/40"
                    >
                      <span className="text-[9px] uppercase text-emerald-200/80">
                        Trend
                      </span>
                      <span className="font-semibold">
                        {sig.trend === "Increasing"
                          ? "↗ Increasing"
                          : sig.trend === "Decreasing"
                          ? "↘ Decreasing"
                          : "• Stable"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Metric modal */}
          {/* Compact inline drill-down (does not replace the real deep analysis UX) */}
          {selectedForInline && (
            <InlineDrilldownBar
              kind={selectedForInline.kind}
              signal={selectedForInline.signal}
              onClose={() => setSelectedForInline(null)}
            />
          )}

          {/* Modals */}
          <MetricModal detail={metricDetail} onClose={() => setMetricDetail(null)} />
          <DeepAnalysisModal
            signal={deepSignal}
            activeTab={deepTab}
            onTab={setDeepTab}
            onClose={() => setDeepSignal(null)}
          />
          <DeepAnalysisModal
            signal={deepSignal}
            activeTab={deepTab}
            onTab={setDeepTab}
            onClose={() => setDeepSignal(null)}
          />
          <DeepAnalysisModal signal={deepSignal} onClose={() => setDeepSignal(null)} />
        </section>

        {/* Signals table */}
        <section className="px-4 lg:px-6 mt-3 mb-2 flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-100">All Signals</h2>
              <span className="text-[11px] text-gray-400">932 results</span>
              <div className="hidden md:flex items-center gap-1 ml-3 text-[11px]">
                <button className="rounded-full bg-red-500/20 border border-red-500/60 px-2 py-1 text-red-100 text-[11px]">
                  Critical
                </button>
                <button className="rounded-full bg-amber-500/10 border border-amber-500/40 px-2 py-1 text-amber-100 text-[11px]">
                  High
                </button>
                <button className="rounded-full bg-gray-800 border border-gray-700 px-2 py-1 text-gray-200 text-[11px]">
                  Medium
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  className="h-8 w-52 rounded-full border border-gray-700 bg-gray-900 pl-7 pr-2 text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search drug or reaction..."
                />
                <span className="pointer-events-none absolute left-2 top-1.5 text-[11px] text-gray-500">
                  🔍
                </span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-[11px] text-gray-100 hover:bg-gray-800">
                Filters
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950/90 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-950/95 text-gray-300 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Drug</th>
                    <th className="px-3 py-2 text-left font-medium">Reaction</th>
                    <th className="px-3 py-2 text-right font-medium">PRR</th>
                    <th className="px-3 py-2 text-right font-medium">Cases</th>
                    <th className="px-3 py-2 text-center font-medium">Serious</th>
                    <th className="px-3 py-2 text-center font-medium">Priority</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {signalTableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-900/80">
                      <td className="px-3 py-1.5 text-gray-100">{row.drug}</td>
                      <td className="px-3 py-1.5 text-gray-300">
                        {row.reaction}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-100">
                        {row.prr}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-100">
                        {row.cases}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {row.serious === "Yes" ? (
                          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-200 border border-red-500/40">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-700/40 px-2 py-0.5 text-[10px] font-medium text-gray-100 border border-gray-600/80">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {row.priority === "Critical" ? (
                          <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-100 border border-red-500/60">
                            Critical
                          </span>
                        ) : row.priority === "High" ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-100 border border-amber-500/50">
                            High
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] font-medium text-gray-100 border border-gray-500/60">
                            Medium
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button className="rounded-full border border-gray-600 px-2.5 py-0.5 text-[10px] text-gray-100 hover:bg-gray-700">
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* RIGHT RAIL: AI Assistant */}
      <aside className="w-80 border-l border-gray-800 bg-gray-950/95 backdrop-blur flex flex-col">
        {/* Header + tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-gray-200">
                AI Assistant
              </div>
              <div className="text-[10px] text-gray-400">
                Ask about your current view or serious cases.
              </div>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-gray-600 bg-gray-900"
              />
              Refinement
            </label>
          </div>

          <div className="mt-2 inline-flex rounded-full bg-gray-900 p-1 text-[11px] font-medium text-gray-300">
            <button
              className={[
                "px-2 py-0.5 rounded-full",
                chatTab === "assistant" ? "bg-gray-800 text-gray-100" : "text-gray-400",
              ].join(" ")}
              onClick={() => setChatTab("assistant")}
            >
              AI Assistant
            </button>
            <button
              className={[
                "px-2 py-0.5 rounded-full",
                chatTab === "analyses" ? "bg-gray-800 text-gray-100" : "text-gray-400",
              ].join(" ")}
              onClick={() => setChatTab("analyses")}
            >
              Analyses
            </button>
          </div>
        </div>

        {/* Messages / analyses area */}
        {chatTab === "assistant" ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px] space-y-2">
            {chatMessages.map((msg) =>
              msg.type === "user" ? (
                <div
                  key={msg.id}
                  className="ml-6 max-w-xs rounded-2xl bg-blue-500/10 border border-blue-500/50 px-3 py-2 text-[11px] text-gray-50 self-end"
                >
                  <div className="text-[9px] uppercase tracking-[0.16em] text-blue-200 mb-0.5">
                    You · natural language
                  </div>
                  <div>{msg.text}</div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="relative mr-6 max-w-xs rounded-2xl bg-gray-900 border border-gray-700 px-3 py-2 text-[11px] text-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.16em] text-gray-400 mb-0.5">
                        Assistant · summary
                      </div>
                      <div>{msg.text}</div>
                    </div>
                    {msg.hasMenu && (
                      <div className="relative">
                        <button
                          onClick={() => setChatMenuOpen((v) => !v)}
                          className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 text-xs"
                        >
                          ⋮
                        </button>
                        {chatMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 rounded-md border border-gray-700 bg-gray-950 shadow-lg z-10">
                            <button
                              className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                              onClick={handleViewInterpretation}
                            >
                              {showInterpretation
                                ? "Hide interpreted filters"
                                : "View interpreted filters"}
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                              onClick={handleConfirmGenerate}
                            >
                              Confirm &amp; generate report
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                              onClick={handleAdjustFilters}
                            >
                              Adjust filters
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.hasMenu && showInterpretation && (
                    <div className="mt-2 rounded-md border border-blue-500/40 bg-blue-500/5 px-2 py-1.5 text-[10px] text-blue-100">
                      <div className="font-semibold mb-0.5">Interpreted query</div>
                      <div>
                        Filtering to: <strong>Drug A</strong> ·{" "}
                        <strong>SMQ: Hemorrhage</strong> · Serious ={" "}
                        <strong>Yes</strong> · Period:{" "}
                        <strong>last 12 months</strong> · Scope:{" "}
                        <strong>Org</strong>.
                      </div>
                    </div>
                  )}

                  {msg.hasMenu && lastAction === "generated" && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-100">
                      ✓ Mock: report generated – deep analysis view would open
                      in the real app.
                    </div>
                  )}

                  {msg.hasMenu && lastAction === "adjusted" && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-500/60 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-100">
                      ⧉ Mock: filter builder would open pre-filled with these
                      criteria.
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px]">
            <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-1">
              This session's analyses
            </div>
            <div className="space-y-1.5">
              {sessionAnalyses.map((a) => (
                <button
                  key={a.id}
                  className="w-full rounded-md border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-left hover:bg-gray-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-100">{a.title}</span>
                    <span className="text-[10px] text-gray-400">{a.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt input (anchored, not scrolling with page) */}
        <div className="px-3 py-2 border-t border-gray-800">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-3 py-1.5">
            <input
              className="flex-1 bg-transparent text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none"
              placeholder="Ask about cases, drugs, time windows, or safety questions…"
            />
            <button className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs hover:bg-blue-400">
              ↗
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder pages for other nav items
// ---------------------------------------------------------------------------

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
      {label} page placeholder – wire this to your real modules later.
    </div>
  );
}

function DashboardPageMock() {
  return <PlaceholderPage label="Dashboard" />;
}

function AnalysesPageMock() {
  return <PlaceholderPage label="Analyses" />;
}

function SettingsPageMock() {
  return <PlaceholderPage label="Settings" />;
}
