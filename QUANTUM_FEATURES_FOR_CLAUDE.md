# 🚀 QUANTUM FEATURES EXTRACTION FOR CLAUDE

## 📋 OVERVIEW

This document extracts the core algorithms from the original AetherSignal Streamlit implementation for Phase 4 implementation. All code is from `backup/aethersignal/` folder.

---

## 1. ⚛️ QUANTUM SCORING FORMULA

### **File Location:** `backup/aethersignal/src/quantum_ranking.py`

### **Core Function:** `_calculate_quantum_score(features: Dict[str, float]) -> float`

### **Component Weights:**

```python
# Base Components (Weighted Linear Combination)
base_score = (
    0.40 * rarity +           # Rare signals are more interesting
    0.35 * seriousness +      # Serious signals are more important
    0.20 * recency +           # Recent signals are more relevant
    0.05 * min(1.0, count / 10.0)  # Minimum count threshold (normalized)
)
```

### **Component Calculations:**

#### **1. Rarity (40% weight)**
```python
rarity = 1.0 - (count / total_cases) if total_cases > 0 else 0.0
rarity = max(0.0, min(1.0, rarity))  # Clamp to [0, 1]
```
- **Formula:** `1 - (signal_count / total_cases)`
- **Interpretation:** Lower proportion = rarer = higher score
- **Range:** 0.0 to 1.0

#### **2. Seriousness (35% weight)**
```python
def _calculate_seriousness_score(signal: Dict[str, Any]) -> float:
    score = 0.0
    
    # Explicit seriousness flag
    if seriousness == '1' or 'yes' or 'serious':
        score += 0.5
    
    # Outcome-based scoring
    if 'death' or 'fatal' in outcome:
        score += 0.5
    elif 'hospital' or 'life threatening' in outcome:
        score += 0.3
    elif 'disability' in outcome:
        score += 0.2
    
    # Serious proportion
    serious_proportion = serious_count / total_count
    score += serious_proportion * 0.3
    
    return min(1.0, score)  # Cap at 1.0
```

#### **3. Recency (20% weight)**
```python
def _calculate_recency_score(signal: Dict[str, Any]) -> float:
    days_ago = (current_date - most_recent_date).days
    
    if days_ago <= 365:
        recency_score = 1.0 - (days_ago / 365.0) * 0.5  # 0.5 to 1.0 for last year
    elif days_ago <= 730:
        recency_score = 0.5 - ((days_ago - 365) / 365.0) * 0.3  # 0.2 to 0.5 for year 2
    else:
        recency_score = max(0.0, 0.2 - (days_ago - 730) / 3650.0)  # Diminishing for older
    
    return max(0.0, min(1.0, recency_score))
```

#### **4. Count (5% weight)**
```python
count_component = min(1.0, count / 10.0)  # Normalized: 10+ cases = full score
```

### **Quantum-Inspired Enhancements (Non-Linear Interactions):**

```python
interaction_term = 0.0

# Rare + Serious: especially important combination
if rarity > 0.7 and seriousness > 0.5:
    interaction_term += 0.15

# Rare + Recent: emerging signals
if rarity > 0.7 and recency > 0.7:
    interaction_term += 0.10

# Serious + Recent: urgent signals
if seriousness > 0.7 and recency > 0.7:
    interaction_term += 0.10

# All three: critical signals
if rarity > 0.6 and seriousness > 0.6 and recency > 0.6:
    interaction_term += 0.20

# Quantum tunneling effect: boost signals that are "close" to thresholds
tunneling_boost = 0.0
if 0.5 < rarity <= 0.7:
    tunneling_boost += 0.05
if 0.5 < seriousness <= 0.7:
    tunneling_boost += 0.05
if 0.5 < recency <= 0.7:
    tunneling_boost += 0.05
```

### **Final Quantum Score:**

```python
quantum_score = base_score + interaction_term + tunneling_boost
quantum_score = max(0.0, quantum_score)  # Ensure positive
```

### **Normalization:**
- **Input:** All components normalized to [0, 1]
- **Output:** Quantum score in [0, 1+], typically [0, 1.5] with interactions
- **No explicit normalization** - score can exceed 1.0 due to interaction boosts

---

## 2. 🔄 MULTI-SOURCE QUANTUM SCORING (Enhanced Version)

### **File Location:** `backup/aethersignal/src/ai/multi_source_quantum_scoring.py`

### **Class:** `MultiSourceQuantumScoring`

### **Component Weights:**

```python
self.weights = {
    "frequency": 0.25,      # Case count frequency
    "severity": 0.20,       # Seriousness/severity
    "burst": 0.15,          # Temporal anomaly detection
    "novelty": 0.15,        # Label novelty (not in label)
    "consensus": 0.15,      # Cross-source agreement
    "mechanism": 0.10       # Mechanistic plausibility
}
```

### **Component Calculations:**

#### **1. Frequency Score (25%)**
```python
def _compute_frequency_score(self, df: pd.DataFrame) -> float:
    count = len(df)
    
    if count == 0:
        return 0.0
    elif count >= 100:
        return 1.0
    elif count >= 50:
        return 0.8
    elif count >= 20:
        return 0.6
    elif count >= 10:
        return 0.4
    elif count >= 5:
        return 0.3
    elif count >= 3:
        return 0.2
    else:
        return 0.1
```

#### **2. Severity Score (20%)**
```python
def _compute_severity_score(self, df: pd.DataFrame) -> float:
    if "severity" in df.columns:
        return df["severity"].mean()
    
    # Fallback: check for serious keywords
    serious_keywords = ["hospital", "er", "emergency", "severe", "death", "fatal"]
    serious_count = df["text"].str.lower().str.contains("|".join(serious_keywords)).sum()
    return min(serious_count / len(df), 1.0) if len(df) > 0 else 0.0
```

#### **3. Burst Score (15%)**
```python
def _compute_burst_score(self, df: pd.DataFrame) -> float:
    # Create time series from timestamps
    daily = df.groupby(df["date"].dt.date).size()
    
    # Score time series for anomalies (uses quantum_anomaly module)
    scored = score_time_series(daily)
    max_anomaly = scored["anomaly_score"].max()
    
    # Normalize to 0-1 (threshold at 2.5)
    burst_score = min(max_anomaly / 2.5, 1.0)
    return float(burst_score)
```

#### **4. Novelty Score (15%)**
```python
def _compute_novelty_score(self, reaction: str, label_reactions: List[str], df: pd.DataFrame) -> float:
    # Check if reaction is in label
    is_labeled = any(reaction.lower() in known.lower() for known in label_reactions)
    if is_labeled:
        return 0.0  # Known, not novel
    
    # Check recency (more recent = more novel)
    days_ago = (datetime.now() - df["date"].max()).days
    
    if days_ago <= 30:
        return 1.0
    elif days_ago <= 90:
        return 0.8
    elif days_ago <= 180:
        return 0.6
    elif days_ago <= 365:
        return 0.4
    else:
        return 0.2
```

#### **5. Cross-Source Consensus (15%)**
```python
def _compute_consensus_score(self, df: pd.DataFrame, sources: List[str]) -> float:
    unique_sources = df["source"].unique().tolist()
    source_count = len(unique_sources)
    
    # Available sources (default: 7)
    available_sources = len(sources) if sources else 7
    
    # Consensus = sources reporting / total available
    consensus = min(source_count / available_sources, 1.0)
    
    # Boost if multiple high-confidence sources agree
    if "confidence" in df.columns:
        high_conf_sources = df[df["confidence"] >= 0.7]["source"].nunique()
        if high_conf_sources >= 3:
            consensus = min(consensus + 0.2, 1.0)
    
    return consensus
```

#### **6. Mechanism Plausibility (10%)**
```python
def _compute_mechanism_score(self, drug: str, reaction: str, df: pd.DataFrame) -> float:
    # Check if reaction appears in literature (PubMed)
    has_literature = "pubmed" in df["source"].values or "literature" in df["source"].values
    if has_literature:
        return 0.7  # Literature support = plausible
    
    # Check if reaction appears in clinical trials
    has_clinical = "clinicaltrials" in df["source"].values
    if has_clinical:
        return 0.8  # Clinical trial support = more plausible
    
    # Default: moderate plausibility
    return 0.5
```

### **Final Multi-Source Quantum Score:**

```python
quantum_score = sum(
    components[dim] * self.weights[dim]
    for dim in self.weights.keys()
)

quantum_score = max(0.0, min(1.0, quantum_score))  # Clamp to [0, 1]
```

### **Alert Level Classification:**

```python
def _determine_alert_level(self, quantum_score: float, components: Dict) -> str:
    if quantum_score >= 0.95:
        return "critical"
    elif quantum_score >= 0.80:
        return "high"
    elif quantum_score >= 0.65:
        return "moderate"
    elif quantum_score >= 0.45:
        return "watchlist"
    elif quantum_score >= 0.25:
        return "low"
    else:
        return "none"
```

---

## 3. 🔍 MULTI-SOURCE CORROBORATION LOGIC

### **File Location:** `backup/aethersignal/src/ai/cross_source_consensus.py`

### **Source Priority Rankings:**

```python
SOURCE_WEIGHTS = {
    "openfda": 1.0,          # Highest reliability
    "faers": 1.0,            # Highest reliability
    "dailymed": 0.9,         # Label information
    "clinicaltrials": 0.8,   # Controlled studies
    "pubmed": 0.7,           # Literature
    "ema": 0.9,              # Regulatory
    "yellowcard": 0.8,       # UK regulatory
    "health_canada": 0.8,    # Canadian regulatory
    "social": 0.5,           # Lower reliability (noise)
    "literature": 0.7
}
```

### **Consensus Calculation:**

```python
def compute_consensus(self, drug: str, reaction: str, df: pd.DataFrame) -> Dict[str, Any]:
    # Count unique sources reporting this signal
    unique_sources = df["source"].unique().tolist()
    source_count = len(unique_sources)
    
    # Calculate weighted consensus
    total_weight = 0.0
    for source in unique_sources:
        weight = self.SOURCE_WEIGHTS.get(source, 0.5)  # Default 0.5
        total_weight += weight
    
    # Normalize by number of available sources
    available_sources = 7  # Default: Social, FAERS, PubMed, ClinicalTrials, DailyMed, EMA, etc.
    consensus = min(total_weight / available_sources, 1.0)
    
    # Boost if multiple high-confidence sources agree
    if "confidence" in df.columns:
        high_conf_sources = df[df["confidence"] >= 0.7]["source"].nunique()
        if high_conf_sources >= 3:
            consensus = min(consensus + 0.2, 1.0)
    
    return {
        "consensus_score": consensus,
        "source_count": source_count,
        "sources": unique_sources,
        "weighted_consensus": total_weight
    }
```

### **Corroboration Strength Thresholds:**

```python
# From multi_source_quantum_scoring.py
if consensus >= 0.7:  # 70% of sources agree
    alert_level = "high"
elif consensus >= 0.5:  # 50% of sources agree
    alert_level = "moderate"
else:
    alert_level = "low"
```

### **Confidence Calculation:**

```python
# Confidence is calculated from:
# 1. Source reliability weights (above)
# 2. Number of sources reporting
# 3. High-confidence source count (confidence >= 0.7)
# 4. Cross-source agreement

confidence = (
    (source_count / available_sources) * 0.4 +  # Coverage
    (weighted_consensus / source_count) * 0.3 +  # Quality
    (high_conf_count / source_count) * 0.3       # Reliability
)
```

---

## 4. 🗣️ NLP QUERY PARSING

### **File Location:** `backup/aethersignal/src/nl_query_parser.py`

### **Core Function:** `parse_query_to_filters(query: str, normalized_df: pd.DataFrame) -> Dict`

### **Drug Class Mappings:**

The system does **NOT** have hardcoded drug class mappings. Instead, it uses:

1. **Context-aware detection** - Checks if terms exist in the dataset
2. **Pattern matching** - Extracts drug names from queries like:
   - "drug: X"
   - "medication: X"
   - "show X cases"
   - "find X"

```python
# Drug extraction patterns
drug_patterns = [
    r'(?:drug|medication|product|substance)[\s:]+([a-z0-9\s\-]+?)(?:\.|,|$|\s+and|\s+or)',
    r'(?:show|find|search|filter|cases with|reports for)[\s]+([a-z0-9\s\-]+?)(?:\s+and|\s+or|\.|,|$)',
    r'^([a-z0-9\s\-]+?)(?:\s+and|\s+or|\s+reaction|\s+event)',
]

# Context-aware detection (checks dataset)
def _detect_term_in_dataset(term: str, normalized_df: pd.DataFrame) -> Tuple[str, bool, bool]:
    # Checks if term exists in drug_name or reaction columns
    # Returns: (matched_term, is_drug, is_reaction)
```

### **Event Synonym Dictionaries:**

The system does **NOT** have hardcoded event synonym dictionaries. Instead:

1. **MedDRA mapping** - Uses MedDRA PT (Preferred Term) matching
2. **Fuzzy matching** - Normalizes text and does substring matching
3. **Context-aware** - Checks if term exists in reaction column

```python
# Reaction extraction
reaction_patterns = [
    r'\b(?:reaction|adverse event|ae|event|adr|side effect)\b[\s:]+([a-z0-9\s\-]+?)(?:\.|,|$|\s+and|\s+or)',
]

# Normalization
def normalize_text(text: str) -> str:
    return text.lower().strip()
```

### **Age Group Definitions:**

```python
# Population groups - Age-based
if re.search(r'\b(seniors?|elderly|older adults?|geriatric)\b', query_lower):
    filters['age_min'] = 65  # Seniors typically 65+

if re.search(r'\b(pediatric|pediatrics|children|kids?|infants?|neonates?|toddlers?)\b', query_lower):
    filters['age_max'] = 17  # Pediatrics typically < 18

if re.search(r'\b(adults?|adult patients?)\b', query_lower):
    filters['age_min'] = 18
    filters['age_max'] = 64  # Adults typically 18-64

# Special populations
if re.search(r'\b(women?\s+of\s+childbearing\s+age|reproductive\s+age)\b', query_lower):
    filters['sex'] = 'F'
    filters['age_min'] = 15
    filters['age_max'] = 49  # Typically 15-49 years
```

### **Geographic Mappings:**

```python
# Country extraction
country_patterns = [
    r'country[\s:]+([a-z\s]+?)(?:\.|,|$|\s+and)',
    r'in[\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',  # "in Japan", "in United States"
]

# No hardcoded country mappings - uses exact string matching from dataset
```

### **Temporal Concepts:**

```python
# "recently", "lately", "in the last X"
if re.search(r'\b(recently|lately|recent|current|latest)\b', query_lower):
    filters['date_from'] = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

# "In the last X months/years"
last_pattern = re.search(r'\b(?:in|over|during|for)\s+(?:the\s+)?last\s+(\d+)\s+(month|months|year|years)\b', query_lower)
if last_pattern:
    amount = int(last_pattern.group(1))
    unit = last_pattern.group(2).lower()
    days_ago = amount * 30 if 'month' in unit else amount * 365
    filters['date_from'] = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
```

### **Severity Concepts:**

```python
# Life-threatening
if re.search(r'\b(life.?threatening|fatal|death|mortality|lethal|deadly)\b', query_lower):
    filters['seriousness'] = True
    filters['severity_level'] = 'life_threatening'

# Hospitalization
if re.search(r'\b(hospitalization|hospitalized|hospital\s+admission|inpatient|admitted)\b', query_lower):
    filters['seriousness'] = True
    filters['severity_level'] = 'hospitalization'

# Disability
if re.search(r'\b(disability|disabling|permanent\s+disability)\b', query_lower):
    filters['seriousness'] = True
    filters['severity_level'] = 'disability'
```

### **Example Query Parsing:**

```python
# Query: "Show serious bleeding in elderly Asian patients on anticoagulants"

# Parsed filters:
{
    'reaction': 'bleeding',
    'seriousness': True,
    'severity_level': 'serious',
    'age_min': 65,  # elderly
    'country': 'Asian',  # or could be region-based
    # Note: "anticoagulants" would need drug class expansion (not implemented)
}
```

---

## 5. 📊 PORTFOLIO MONITORING

### **File Location:** `backup/aethersignal/src/watchlist_tab.py`

### **Core Function:** `show_watchlist_tab()`

### **How It Works:**

1. **User Input:** Paste list of drugs (one per line)
2. **Scanning:** For each drug, scan all cases and find drug-event combinations with ≥5 cases
3. **Ranking:** Apply quantum ranking to all signals
4. **Display:** Show top 50 signals ranked by quantum score

### **Daily Automated Sweeps:**

```python
# The watchlist tab runs on-demand (not automated in Streamlit version)
# But the logic supports:
# 1. Batch processing multiple drugs
# 2. Quantum ranking of all signals
# 3. Lazy calculation of PRR/ROR (only for top 50 after ranking)

def run_watchlist(drugs: List[str], normalized_df: pd.DataFrame):
    candidates = []
    for drug in drugs:
        filtered = apply_filters(normalized_df, {"drug": drug})
        combos = get_drug_event_combinations(filtered, min_cases=5)
        candidates.extend(combos)
    
    # Quantum ranking (doesn't need PRR/ROR)
    ranked = quantum_rerank_signals(candidates)
    
    # Lazy calculation: PRR/ROR only for top 50
    top_50 = ranked[:50]
    for signal in top_50:
        signal['prr'], signal['ror'] = calculate_prr_ror(
            signal['drug'], signal['reaction'], normalized_df
        )
    
    return ranked
```

### **Multi-Drug Watchlist:**

```python
# Input: List of drugs (one per line)
watchlist = """
aspirin
warfarin
apixaban
rivaroxaban
"""

drugs = [d.strip() for d in watchlist.split("\n") if d.strip()]

# Process all drugs simultaneously
# Returns: Unified ranked list of all signals across all drugs
```

### **Output Format:**

```python
{
    'source_drug': 'aspirin',
    'reaction': 'bleeding',
    'count': 15,
    'quantum_score': 0.7234,
    'quantum_rank': 1,
    'classical_rank': 5,
    'prr': 2.34,
    'ror': 2.45,
    'severity': '🔴 High'
}
```

---

## 📝 SUMMARY FOR CLAUDE

### **What You Have:**

1. ✅ **Quantum Scoring Formula** - Complete with weights, components, and interaction terms
2. ✅ **Multi-Source Corroboration** - Source weights, consensus calculation, confidence scoring
3. ✅ **NLP Query Parsing** - Pattern matching, age groups, temporal concepts, severity detection
4. ✅ **Portfolio Monitoring** - Multi-drug watchlist, lazy PRR/ROR calculation, quantum ranking

### **What's Missing (Not in Original):**

1. ❌ **Drug Class Expansion** - "anticoagulants" → [warfarin, apixaban, ...] (not implemented)
2. ❌ **Event Synonym Dictionaries** - MedDRA mapping exists but not hardcoded synonyms
3. ❌ **Automated Daily Sweeps** - Logic exists but not scheduled (Streamlit limitation)

### **Recommendations for Phase 4:**

1. **Add Drug Class Mappings:**
   ```python
   DRUG_CLASSES = {
       "anticoagulants": ["warfarin", "apixaban", "rivaroxaban", "dabigatran", ...],
       "statins": ["atorvastatin", "simvastatin", "rosuvastatin", ...],
       # etc.
   }
   ```

2. **Add Event Synonym Dictionary:**
   ```python
   EVENT_SYNONYMS = {
       "bleeding": ["haemorrhage", "hemorrhage", "blood loss", ...],
       "heart attack": ["myocardial infarction", "MI", "cardiac arrest", ...],
       # etc.
   }
   ```

3. **Add Scheduled Daily Sweeps:**
   - Use Celery/Background tasks for automated runs
   - Store results in database
   - Send alerts for high-priority signals

---

## 📁 FILES REFERENCED

- `backup/aethersignal/src/quantum_ranking.py` - Core quantum scoring
- `backup/aethersignal/src/ai/multi_source_quantum_scoring.py` - Enhanced multi-source scoring
- `backup/aethersignal/src/ai/cross_source_consensus.py` - Source consensus
- `backup/aethersignal/src/nl_query_parser.py` - NLP query parsing
- `backup/aethersignal/src/watchlist_tab.py` - Portfolio monitoring

---

**END OF DOCUMENT**

