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

