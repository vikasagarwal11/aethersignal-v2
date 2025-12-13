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
  { id: "S-2025-12-11-07", label: "Session 7", timestamp: "11-Dec-2025 09:15:00 UTC", files: 9, cases: 162 },
  { id: "S-2025-12-11-08", label: "Session 8", timestamp: "11-Dec-2025 09:20:00 UTC", files: 10, cases: 169 },
  { id: "S-2025-12-11-09", label: "Session 9", timestamp: "11-Dec-2025 09:25:00 UTC", files: 11, cases: 176 },
  { id: "S-2025-12-11-10", label: "Session 10", timestamp: "11-Dec-2025 09:30:00 UTC", files: 12, cases: 183 },
  { id: "S-2025-12-11-11", label: "Session 11", timestamp: "11-Dec-2025 09:35:00 UTC", files: 13, cases: 190 },
  { id: "S-2025-12-11-12", label: "Session 12", timestamp: "11-Dec-2025 09:40:00 UTC", files: 14, cases: 197 },
  { id: "S-2025-12-11-13", label: "Session 13", timestamp: "11-Dec-2025 09:45:00 UTC", files: 15, cases: 204 },
  { id: "S-2025-12-11-14", label: "Session 14", timestamp: "11-Dec-2025 09:50:00 UTC", files: 16, cases: 211 },
  { id: "S-2025-12-11-15", label: "Session 15", timestamp: "11-Dec-2025 09:55:00 UTC", files: 17, cases: 218 },
  { id: "S-2025-12-11-16", label: "Session 16", timestamp: "11-Dec-2025 10:00:00 UTC", files: 18, cases: 225 },
  { id: "S-2025-12-11-17", label: "Session 17", timestamp: "11-Dec-2025 10:05:00 UTC", files: 19, cases: 232 },
  { id: "S-2025-12-11-18", label: "Session 18", timestamp: "11-Dec-2025 10:10:00 UTC", files: 20, cases: 239 },
  { id: "S-2025-12-11-19", label: "Session 19", timestamp: "11-Dec-2025 10:15:00 UTC", files: 21, cases: 246 },
  { id: "S-2025-12-11-20", label: "Session 20", timestamp: "11-Dec-2025 10:20:00 UTC", files: 22, cases: 253 },
  { id: "S-2025-12-11-21", label: "Session 21", timestamp: "11-Dec-2025 10:25:00 UTC", files: 23, cases: 260 },
  { id: "S-2025-12-11-22", label: "Session 22", timestamp: "11-Dec-2025 10:30:00 UTC", files: 24, cases: 267 },
  { id: "S-2025-12-11-23", label: "Session 23", timestamp: "11-Dec-2025 10:35:00 UTC", files: 25, cases: 274 },
  { id: "S-2025-12-11-24", label: "Session 24", timestamp: "11-Dec-2025 10:40:00 UTC", files: 26, cases: 281 },
  { id: "S-2025-12-11-25", label: "Session 25", timestamp: "11-Dec-2025 10:45:00 UTC", files: 27, cases: 288 },
  { id: "S-2025-12-11-26", label: "Session 26", timestamp: "11-Dec-2025 10:50:00 UTC", files: 28, cases: 295 },
] as const;

export const sessionAnalyses = [
  { id: "AN-001", title: "Bleeding risk · Drug 1", type: "AI summary", ts: "11-Dec-2025 09:12:19 UTC" },
  { id: "AN-002", title: "Bleeding risk · Drug 2", type: "AI summary", ts: "11-Dec-2025 09:12:52 UTC" },
  { id: "AN-003", title: "Bleeding risk · Drug 3", type: "AI summary", ts: "11-Dec-2025 09:13:10 UTC" },
] as const;

export type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  text: string;
  hasMenu?: boolean;
};

export const chatMessages: ChatMessage[] = [
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

export type SignalTableRow = {
  id: string;
  drug: string;
  reaction: string;
  prr: string;
  cases: number;
  serious: "Yes" | "No";
  priority: "Critical" | "High" | "Medium";
};

export const signalTableRows: SignalTableRow[] = [
  { id: "row-1", drug: "Aspirin", reaction: "Gastrointestinal bleeding", prr: "15.3", cases: 234, serious: "Yes", priority: "Critical" },
  { id: "row-2", drug: "Warfarin", reaction: "Internal hemorrhage", prr: "12.8", cases: 189, serious: "Yes", priority: "Critical" },
  { id: "row-3", drug: "Metformin", reaction: "Lactic acidosis", prr: "8.4", cases: 156, serious: "Yes", priority: "High" },
  { id: "row-4", drug: "Lisinopril", reaction: "Angioedema", prr: "6.2", cases: 98, serious: "Yes", priority: "High" },
  { id: "row-5", drug: "Atorvastatin", reaction: "Rhabdomyolysis", prr: "5.1", cases: 67, serious: "Yes", priority: "Medium" },
  { id: "row-6", drug: "Drug F", reaction: "Some adverse event description", prr: "3.9", cases: 45, serious: "No", priority: "Medium" },
  { id: "row-7", drug: "Ibuprofen", reaction: "Acute kidney injury", prr: "4.8", cases: 123, serious: "Yes", priority: "High" },
  { id: "row-8", drug: "Omeprazole", reaction: "Clostridium difficile infection", prr: "3.2", cases: 89, serious: "Yes", priority: "Medium" },
  { id: "row-9", drug: "Amoxicillin", reaction: "Stevens-Johnson syndrome", prr: "2.7", cases: 34, serious: "Yes", priority: "High" },
  { id: "row-10", drug: "Paracetamol", reaction: "Hepatotoxicity", prr: "5.4", cases: 156, serious: "Yes", priority: "High" },
  { id: "row-11", drug: "Ramipril", reaction: "Cough", prr: "2.1", cases: 78, serious: "No", priority: "Medium" },
  { id: "row-12", drug: "Simvastatin", reaction: "Myopathy", prr: "4.3", cases: 112, serious: "Yes", priority: "High" },
  { id: "row-13", drug: "Amlodipine", reaction: "Peripheral edema", prr: "2.9", cases: 67, serious: "No", priority: "Medium" },
  { id: "row-14", drug: "Levothyroxine", reaction: "Atrial fibrillation", prr: "3.5", cases: 91, serious: "Yes", priority: "Medium" },
  { id: "row-15", drug: "Azithromycin", reaction: "QT prolongation", prr: "4.1", cases: 45, serious: "Yes", priority: "High" },
  { id: "row-16", drug: "Fluoxetine", reaction: "Serotonin syndrome", prr: "3.8", cases: 56, serious: "Yes", priority: "High" },
  { id: "row-17", drug: "Digoxin", reaction: "Digitalis toxicity", prr: "6.2", cases: 134, serious: "Yes", priority: "High" },
  { id: "row-18", drug: "Furosemide", reaction: "Hypokalemia", prr: "3.6", cases: 102, serious: "Yes", priority: "Medium" },
  { id: "row-19", drug: "Metoprolol", reaction: "Bradycardia", prr: "3.1", cases: 73, serious: "Yes", priority: "Medium" },
  { id: "row-20", drug: "Tramadol", reaction: "Seizure", prr: "4.7", cases: 67, serious: "Yes", priority: "High" },
  { id: "row-21", drug: "Ciprofloxacin", reaction: "Tendon rupture", prr: "5.9", cases: 89, serious: "Yes", priority: "High" },
  { id: "row-22", drug: "Allopurinol", reaction: "Drug reaction with eosinophilia", prr: "4.2", cases: 58, serious: "Yes", priority: "High" },
  { id: "row-23", drug: "Carbamazepine", reaction: "Hyponatremia", prr: "3.4", cases: 81, serious: "Yes", priority: "Medium" },
  { id: "row-24", drug: "Vancomycin", reaction: "Red man syndrome", prr: "2.8", cases: 42, serious: "No", priority: "Medium" },
  { id: "row-25", drug: "Phenytoin", reaction: "Gingival hyperplasia", prr: "2.5", cases: 39, serious: "No", priority: "Medium" },
  { id: "row-26", drug: "Warfarin", reaction: "Hemorrhage", prr: "7.1", cases: 201, serious: "Yes", priority: "Critical" },
  { id: "row-27", drug: "Lithium", reaction: "Lithium toxicity", prr: "5.6", cases: 67, serious: "Yes", priority: "High" },
  { id: "row-28", drug: "Methotrexate", reaction: "Pulmonary fibrosis", prr: "4.9", cases: 54, serious: "Yes", priority: "High" },
  { id: "row-29", drug: "Doxycycline", reaction: "Photosensitivity", prr: "2.3", cases: 61, serious: "No", priority: "Medium" },
  { id: "row-30", drug: "Spironolactone", reaction: "Hyperkalemia", prr: "4.5", cases: 95, serious: "Yes", priority: "High" },
  { id: "row-31", drug: "Hydrochlorothiazide", reaction: "Photosensitivity", prr: "2.7", cases: 48, serious: "No", priority: "Medium" },
  { id: "row-32", drug: "Sertraline", reaction: "Suicidal ideation", prr: "3.9", cases: 72, serious: "Yes", priority: "High" },
  { id: "row-33", drug: "Clopidogrel", reaction: "Thrombotic thrombocytopenic purpura", prr: "5.2", cases: 83, serious: "Yes", priority: "High" },
  { id: "row-34", drug: "Insulin glargine", reaction: "Hypoglycemia", prr: "4.6", cases: 127, serious: "Yes", priority: "High" },
  { id: "row-35", drug: "Alendronate", reaction: "Atypical femoral fracture", prr: "3.7", cases: 59, serious: "Yes", priority: "Medium" },
  { id: "row-36", drug: "Rosuvastatin", reaction: "Rhabdomyolysis", prr: "4.4", cases: 76, serious: "Yes", priority: "High" },
  { id: "row-37", drug: "Montelukast", reaction: "Neuropsychiatric events", prr: "3.3", cases: 64, serious: "Yes", priority: "Medium" },
  { id: "row-38", drug: "Losartan", reaction: "Angioedema", prr: "2.6", cases: 41, serious: "Yes", priority: "Medium" },
  { id: "row-39", drug: "Pantoprazole", reaction: "Bone fracture", prr: "3.0", cases: 103, serious: "Yes", priority: "Medium" },
  { id: "row-40", drug: "Duloxetine", reaction: "Hepatotoxicity", prr: "4.0", cases: 55, serious: "Yes", priority: "High" },
  { id: "row-41", drug: "Ticlopidine", reaction: "Aplastic anemia", prr: "6.8", cases: 38, serious: "Yes", priority: "Critical" },
  { id: "row-42", drug: "Gabapentin", reaction: "Suicidal behavior", prr: "3.2", cases: 69, serious: "Yes", priority: "Medium" },
  { id: "row-43", drug: "Tolterodine", reaction: "Dry mouth", prr: "1.8", cases: 47, serious: "No", priority: "Medium" },
  { id: "row-44", drug: "Quetiapine", reaction: "Weight gain", prr: "2.4", cases: 88, serious: "No", priority: "Medium" },
  { id: "row-45", drug: "Lamotrigine", reaction: "Stevens-Johnson syndrome", prr: "5.1", cases: 52, serious: "Yes", priority: "High" },
  { id: "row-46", drug: "Terbinafine", reaction: "Hepatotoxicity", prr: "4.8", cases: 43, serious: "Yes", priority: "High" },
  { id: "row-47", drug: "Enalapril", reaction: "Angioedema", prr: "3.6", cases: 71, serious: "Yes", priority: "Medium" },
  { id: "row-48", drug: "Prednisolone", reaction: "Osteoporosis", prr: "3.5", cases: 124, serious: "Yes", priority: "Medium" },
  { id: "row-49", drug: "Nifedipine", reaction: "Peripheral edema", prr: "2.9", cases: 66, serious: "No", priority: "Medium" },
  { id: "row-50", drug: "Pioglitazone", reaction: "Bladder cancer", prr: "5.5", cases: 97, serious: "Yes", priority: "High" },
  { id: "row-51", drug: "Olanzapine", reaction: "Metabolic syndrome", prr: "3.8", cases: 105, serious: "Yes", priority: "Medium" },
  { id: "row-52", drug: "Bisoprolol", reaction: "Bradycardia", prr: "2.7", cases: 53, serious: "Yes", priority: "Medium" },
  { id: "row-53", drug: "Levofloxacin", reaction: "Tendonitis", prr: "4.2", cases: 62, serious: "Yes", priority: "High" },
  { id: "row-54", drug: "Cyclosporine", reaction: "Nephrotoxicity", prr: "6.5", cases: 79, serious: "Yes", priority: "High" },
  { id: "row-55", drug: "Amitriptyline", reaction: "Cardiac arrhythmia", prr: "4.1", cases: 58, serious: "Yes", priority: "High" },
  { id: "row-56", drug: "Pregabalin", reaction: "Peripheral edema", prr: "2.5", cases: 84, serious: "No", priority: "Medium" },
];

// =========================
// Trajectory Data (Time-Series for Charts)
// =========================

export type TrajectoryDataPoint = {
  date: string; // Format: "YYYY-MM"
  cases: number;
  lower: number; // Confidence band lower bound
  upper: number; // Confidence band upper bound
};

export type TrajectoryData = {
  historical: TrajectoryDataPoint[];
  forecast: {
    noAction: TrajectoryDataPoint[];
    intervention: TrajectoryDataPoint[];
  };
};

// Per-signal trajectory data (realistic mock for prototype)
export const trajectoryDataBySignal: Record<string, TrajectoryData> = {
  aspirin_gi_bleeding: {
    historical: [
      { date: "2025-01", cases: 120, lower: 110, upper: 130 },
      { date: "2025-02", cases: 135, lower: 125, upper: 145 },
      { date: "2025-03", cases: 148, lower: 135, upper: 160 },
      { date: "2025-04", cases: 165, lower: 150, upper: 180 },
      { date: "2025-05", cases: 182, lower: 165, upper: 200 },
      { date: "2025-06", cases: 205, lower: 185, upper: 225 },
      { date: "2025-07", cases: 234, lower: 210, upper: 258 },
    ],
    forecast: {
      noAction: [
        { date: "2025-08", cases: 265, lower: 235, upper: 295 },
        { date: "2025-09", cases: 298, lower: 260, upper: 335 },
        { date: "2025-10", cases: 335, lower: 290, upper: 380 },
        { date: "2025-11", cases: 375, lower: 320, upper: 430 },
        { date: "2025-12", cases: 420, lower: 350, upper: 490 },
      ],
      intervention: [
        { date: "2025-08", cases: 245, lower: 220, upper: 270 },
        { date: "2025-09", cases: 260, lower: 230, upper: 290 },
        { date: "2025-10", cases: 275, lower: 240, upper: 310 },
        { date: "2025-11", cases: 285, lower: 245, upper: 325 },
        { date: "2025-12", cases: 295, lower: 250, upper: 340 },
      ],
    },
  },
  warfarin_internal_hemorrhage: {
    historical: [
      { date: "2025-01", cases: 95, lower: 85, upper: 105 },
      { date: "2025-02", cases: 108, lower: 98, upper: 118 },
      { date: "2025-03", cases: 125, lower: 115, upper: 135 },
      { date: "2025-04", cases: 142, lower: 130, upper: 154 },
      { date: "2025-05", cases: 158, lower: 145, upper: 171 },
      { date: "2025-06", cases: 172, lower: 158, upper: 186 },
      { date: "2025-07", cases: 189, lower: 173, upper: 205 },
    ],
    forecast: {
      noAction: [
        { date: "2025-08", cases: 208, lower: 188, upper: 228 },
        { date: "2025-09", cases: 228, lower: 205, upper: 251 },
        { date: "2025-10", cases: 250, lower: 225, upper: 275 },
        { date: "2025-11", cases: 275, lower: 247, upper: 303 },
        { date: "2025-12", cases: 302, lower: 270, upper: 334 },
      ],
      intervention: [
        { date: "2025-08", cases: 195, lower: 175, upper: 215 },
        { date: "2025-09", cases: 202, lower: 180, upper: 224 },
        { date: "2025-10", cases: 210, lower: 187, upper: 233 },
        { date: "2025-11", cases: 218, lower: 194, upper: 242 },
        { date: "2025-12", cases: 225, lower: 200, upper: 250 },
      ],
    },
  },
  metformin_lactic_acidosis: {
    historical: [
      { date: "2025-01", cases: 98, lower: 88, upper: 108 },
      { date: "2025-02", cases: 112, lower: 102, upper: 122 },
      { date: "2025-03", cases: 128, lower: 116, upper: 140 },
      { date: "2025-04", cases: 138, lower: 125, upper: 151 },
      { date: "2025-05", cases: 145, lower: 132, upper: 158 },
      { date: "2025-06", cases: 150, lower: 137, upper: 163 },
      { date: "2025-07", cases: 156, lower: 142, upper: 170 },
    ],
    forecast: {
      noAction: [
        { date: "2025-08", cases: 165, lower: 150, upper: 180 },
        { date: "2025-09", cases: 175, lower: 158, upper: 192 },
        { date: "2025-10", cases: 186, lower: 168, upper: 204 },
        { date: "2025-11", cases: 198, lower: 178, upper: 218 },
        { date: "2025-12", cases: 210, lower: 189, upper: 231 },
      ],
      intervention: [
        { date: "2025-08", cases: 158, lower: 143, upper: 173 },
        { date: "2025-09", cases: 160, lower: 145, upper: 175 },
        { date: "2025-10", cases: 162, lower: 147, upper: 177 },
        { date: "2025-11", cases: 164, lower: 149, upper: 179 },
        { date: "2025-12", cases: 166, lower: 151, upper: 181 },
      ],
    },
  },
  lisinopril_angioedema: {
    historical: [
      { date: "2025-01", cases: 72, lower: 65, upper: 79 },
      { date: "2025-02", cases: 78, lower: 71, upper: 85 },
      { date: "2025-03", cases: 85, lower: 77, upper: 93 },
      { date: "2025-04", cases: 90, lower: 82, upper: 98 },
      { date: "2025-05", cases: 94, lower: 86, upper: 102 },
      { date: "2025-06", cases: 96, lower: 88, upper: 104 },
      { date: "2025-07", cases: 98, lower: 90, upper: 106 },
    ],
    forecast: {
      noAction: [
        { date: "2025-08", cases: 101, lower: 92, upper: 110 },
        { date: "2025-09", cases: 104, lower: 95, upper: 113 },
        { date: "2025-10", cases: 107, lower: 98, upper: 116 },
        { date: "2025-11", cases: 110, lower: 101, upper: 119 },
        { date: "2025-12", cases: 113, lower: 104, upper: 122 },
      ],
      intervention: [
        { date: "2025-08", cases: 99, lower: 90, upper: 108 },
        { date: "2025-09", cases: 100, lower: 91, upper: 109 },
        { date: "2025-10", cases: 101, lower: 92, upper: 110 },
        { date: "2025-11", cases: 102, lower: 93, upper: 111 },
        { date: "2025-12", cases: 103, lower: 94, upper: 112 },
      ],
    },
  },
  atorvastatin_rhabdo: {
    historical: [
      { date: "2025-01", cases: 52, lower: 47, upper: 57 },
      { date: "2025-02", cases: 56, lower: 51, upper: 61 },
      { date: "2025-03", cases: 60, lower: 55, upper: 65 },
      { date: "2025-04", cases: 63, lower: 58, upper: 68 },
      { date: "2025-05", cases: 65, lower: 60, upper: 70 },
      { date: "2025-06", cases: 66, lower: 61, upper: 71 },
      { date: "2025-07", cases: 67, lower: 62, upper: 72 },
    ],
    forecast: {
      noAction: [
        { date: "2025-08", cases: 68, lower: 63, upper: 73 },
        { date: "2025-09", cases: 69, lower: 64, upper: 74 },
        { date: "2025-10", cases: 70, lower: 65, upper: 75 },
        { date: "2025-11", cases: 71, lower: 66, upper: 76 },
        { date: "2025-12", cases: 72, lower: 67, upper: 77 },
      ],
      intervention: [
        { date: "2025-08", cases: 66, lower: 61, upper: 71 },
        { date: "2025-09", cases: 65, lower: 60, upper: 70 },
        { date: "2025-10", cases: 64, lower: 59, upper: 69 },
        { date: "2025-11", cases: 63, lower: 58, upper: 68 },
        { date: "2025-12", cases: 62, lower: 57, upper: 67 },
      ],
    },
  },
};

// =========================
// Evidence Data (Source Breakdown)
// =========================

export type EvidenceSource = {
  source: string;
  count: number;
  lastUpdate: string;
  newThisWeek?: number;
  icon?: string;
};

export const evidenceDataBySignal: Record<string, EvidenceSource[]> = {
  aspirin_gi_bleeding: [
    { source: "FAERS", count: 234, lastUpdate: "3 days ago", newThisWeek: 12, icon: "📊" },
    { source: "Literature", count: 12, lastUpdate: "1 week ago", newThisWeek: 2, icon: "📚" },
    { source: "Early Signals", count: 45, lastUpdate: "2 days ago", newThisWeek: 8, icon: "🔍" },
  ],
  warfarin_internal_hemorrhage: [
    { source: "FAERS", count: 189, lastUpdate: "2 days ago", newThisWeek: 9, icon: "📊" },
    { source: "Literature", count: 8, lastUpdate: "5 days ago", newThisWeek: 1, icon: "📚" },
    { source: "Early Signals", count: 32, lastUpdate: "1 day ago", newThisWeek: 5, icon: "🔍" },
  ],
  metformin_lactic_acidosis: [
    { source: "FAERS", count: 156, lastUpdate: "4 days ago", newThisWeek: 7, icon: "📊" },
    { source: "Literature", count: 6, lastUpdate: "2 weeks ago", icon: "📚" },
    { source: "Early Signals", count: 28, lastUpdate: "3 days ago", newThisWeek: 4, icon: "🔍" },
  ],
  lisinopril_angioedema: [
    { source: "FAERS", count: 98, lastUpdate: "5 days ago", newThisWeek: 3, icon: "📊" },
    { source: "Literature", count: 4, lastUpdate: "1 week ago", icon: "📚" },
    { source: "Early Signals", count: 18, lastUpdate: "4 days ago", newThisWeek: 2, icon: "🔍" },
  ],
  atorvastatin_rhabdo: [
    { source: "FAERS", count: 67, lastUpdate: "6 days ago", newThisWeek: 2, icon: "📊" },
    { source: "Literature", count: 3, lastUpdate: "2 weeks ago", icon: "📚" },
    { source: "Early Signals", count: 12, lastUpdate: "5 days ago", icon: "🔍" },
  ],
};

// =========================
// Case Data (Individual Safety Cases)
// =========================

export type SafetyCase = {
  caseId: string;
  age: number;
  sex: "M" | "F" | "U";
  serious: boolean;
  outcome: string;
  onsetDate: string;
  country?: string;
};

export const casesDataBySignal: Record<string, SafetyCase[]> = {
  aspirin_gi_bleeding: [
    { caseId: "CASE-2341", age: 65, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-14", country: "US" },
    { caseId: "CASE-2342", age: 72, sex: "M", serious: true, outcome: "Life-threatening", onsetDate: "2025-06-18", country: "US" },
    { caseId: "CASE-2343", age: 58, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-22", country: "CA" },
    { caseId: "CASE-2344", age: 81, sex: "M", serious: true, outcome: "Death", onsetDate: "2025-06-25", country: "US" },
    { caseId: "CASE-2345", age: 54, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-07-01", country: "UK" },
    { caseId: "CASE-2346", age: 67, sex: "M", serious: true, outcome: "Hospitalized", onsetDate: "2025-07-03", country: "US" },
    { caseId: "CASE-2347", age: 73, sex: "F", serious: true, outcome: "Life-threatening", onsetDate: "2025-07-05", country: "DE" },
    { caseId: "CASE-2348", age: 59, sex: "M", serious: false, outcome: "Other", onsetDate: "2025-07-08", country: "US" },
    { caseId: "CASE-2349", age: 68, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-07-10", country: "FR" },
    { caseId: "CASE-2350", age: 75, sex: "M", serious: true, outcome: "Death", onsetDate: "2025-07-12", country: "US" },
  ],
  warfarin_internal_hemorrhage: [
    { caseId: "CASE-1891", age: 71, sex: "M", serious: true, outcome: "Life-threatening", onsetDate: "2025-06-10", country: "US" },
    { caseId: "CASE-1892", age: 68, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-15", country: "US" },
    { caseId: "CASE-1893", age: 79, sex: "M", serious: true, outcome: "Death", onsetDate: "2025-06-20", country: "CA" },
    { caseId: "CASE-1894", age: 62, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-25", country: "UK" },
    { caseId: "CASE-1895", age: 74, sex: "M", serious: true, outcome: "Life-threatening", onsetDate: "2025-07-02", country: "US" },
  ],
  metformin_lactic_acidosis: [
    { caseId: "CASE-1561", age: 58, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-12", country: "US" },
    { caseId: "CASE-1562", age: 65, sex: "M", serious: true, outcome: "Life-threatening", onsetDate: "2025-06-16", country: "US" },
    { caseId: "CASE-1563", age: 72, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-21", country: "DE" },
    { caseId: "CASE-1564", age: 61, sex: "M", serious: true, outcome: "Death", onsetDate: "2025-06-28", country: "FR" },
    { caseId: "CASE-1565", age: 69, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-07-04", country: "US" },
  ],
  lisinopril_angioedema: [
    { caseId: "CASE-0981", age: 55, sex: "M", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-11", country: "US" },
    { caseId: "CASE-0982", age: 63, sex: "F", serious: true, outcome: "Life-threatening", onsetDate: "2025-06-19", country: "US" },
    { caseId: "CASE-0983", age: 57, sex: "M", serious: false, outcome: "Other", onsetDate: "2025-06-24", country: "CA" },
    { caseId: "CASE-0984", age: 66, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-07-01", country: "UK" },
  ],
  atorvastatin_rhabdo: [
    { caseId: "CASE-0671", age: 62, sex: "M", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-13", country: "US" },
    { caseId: "CASE-0672", age: 59, sex: "F", serious: true, outcome: "Hospitalized", onsetDate: "2025-06-17", country: "US" },
    { caseId: "CASE-0673", age: 71, sex: "M", serious: true, outcome: "Life-threatening", onsetDate: "2025-06-26", country: "DE" },
  ],
};

// =========================
// Audit Trail Data
// =========================

export type AuditEvent = {
  id: string;
  action: string;
  actor: "AI" | "User";
  actorName?: string;
  timestamp: string;
  details?: string;
};

export const auditDataBySignal: Record<string, AuditEvent[]> = {
  aspirin_gi_bleeding: [
    {
      id: "audit-1",
      action: "Query executed",
      actor: "AI",
      timestamp: "2025-12-11 09:15:02 UTC",
      details: "Signal detection pipeline run for aspirin_gi_bleeding",
    },
    {
      id: "audit-2",
      action: "Trajectory generated",
      actor: "AI",
      timestamp: "2025-12-11 09:15:05 UTC",
      details: "Forecast model v2.3.1 applied with 6m horizon",
    },
    {
      id: "audit-3",
      action: "Recommendation issued",
      actor: "AI",
      timestamp: "2025-12-11 09:15:08 UTC",
      details: "Escalate - High velocity + severity",
    },
    {
      id: "audit-4",
      action: "Analysis viewed",
      actor: "User",
      actorName: "AR",
      timestamp: "2025-12-11 09:20:15 UTC",
      details: "Deep analysis modal opened",
    },
    {
      id: "audit-5",
      action: "Filters applied",
      actor: "User",
      actorName: "AR",
      timestamp: "2025-12-11 09:21:30 UTC",
      details: "Serious only · Last 12 months · Org scope",
    },
    {
      id: "audit-6",
      action: "Report generated",
      actor: "User",
      actorName: "AR",
      timestamp: "2025-12-11 09:25:44 UTC",
      details: "Briefing PDF exported",
    },
  ],
};

