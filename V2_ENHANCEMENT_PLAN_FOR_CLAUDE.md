# 🚀 AETHERSIGNAL V2 ENHANCEMENT PLAN

**Status:** Phase 4A Complete → V2 Enhancements Proposed  
**Date:** December 9, 2024  
**Purpose:** Upgrade from v1 prototype to production-grade unified system

**Claude's Assessment:** ⭐⭐⭐⭐⭐ EXCEPTIONAL (9.5/10 technical, 10/10 strategic)  
**Claude's Recommendation:** Production-ready with 6 critical improvements needed

---

## 📋 EXECUTIVE SUMMARY

**What We Have (V1):**
- ✅ Quantum ranking (rarity/seriousness/recency + interactions)
- ✅ Multi-source scoring (frequency/severity/burst/novelty/consensus/mechanism)
- ✅ NLP query parser (context-aware, negation handling, population groups)
- ✅ 3-layer fusion engine (Bayesian-Temporal + Quantum Layer 1 + Quantum Layer 2)

**Claude's Immediate Improvements (Phase 0 - 2 weeks):**
- 🔧 **Response models** (type safety, better API docs)
- 🔧 **Batch efficiency** (use Pydantic dict(), less manual mapping)
- 🔧 **Async background tasks** (non-blocking database logging)
- 🔧 **Rate limiting** (prevent abuse, fair usage)
- 🔧 **Caching** (instant repeated queries)
- 🔧 **Monitoring** (Prometheus metrics, Grafana dashboards)

**What We Want (V2 - Strategic Enhancements):**
- 🎯 **Unified signal scoring** with explicit disproportionality component
- 🎯 **Calibrated thresholds** (statistically validated, not heuristic)
- 🎯 **Enhanced multi-source corroboration** (typed sources, hierarchical Bayesian)
- 🎯 **LLM-enhanced NLP** (rules as safety rails, LLM for complex queries)
- 🎯 **Learned weights** (customer-specific or ML-optimized)

**Note:** Claude's improvements are **production readiness** fixes (immediate). V2 enhancements are **algorithmic upgrades** (strategic). Both are needed and complementary.

---

## 1️⃣ CURRENT STATE (V1) - WHAT WE HAVE

### A. Quantum Ranking (Single-Source)

**Location:** `backend/app/core/signal_detection/complete_fusion_engine.py` → `SingleSourceQuantumScorer`

**Current Implementation:**
```python
# Base weights
rarity: 40%
seriousness: 35%
recency: 20%
count: 5%

# Interaction boosts
rare + serious (rarity > 0.7, seriousness > 0.5): +0.15
rare + recent (rarity > 0.7, recency > 0.7): +0.10
serious + recent (seriousness > 0.7, recency > 0.7): +0.10
all three (rarity > 0.6, seriousness > 0.6, recency > 0.6): +0.20

# Tunneling boost
0.5 < x <= 0.7: +0.05 each
```

**Strengths:**
- ✅ Explicit weights (exactly what Claude wanted)
- ✅ Non-linear interactions (beyond typical PV tools)
- ✅ Quantum tunneling effect (unique innovation)

**Gaps:**
- ❌ No explicit disproportionality component (PRR/ROR/EBGM/IC not in quantum score)
- ❌ Thresholds are heuristic (not calibrated to historical outcomes)
- ❌ Weights are fixed (not tunable per customer or learned)

---

### B. Multi-Source Quantum Scoring

**Location:** `backend/app/core/signal_detection/complete_fusion_engine.py` → `MultiSourceQuantumScorer`

**Current Implementation:**
```python
# Component weights
frequency: 25%
severity: 20%
burst: 15%
novelty: 15%
consensus: 15%
mechanism: 10%

# Consensus calculation
consensus = unique_sources / available_sources
if high_conf_sources >= 3: consensus += 0.2

# Mechanism plausibility
if pubmed/literature: 0.7
if clinicaltrials: 0.8
else: 0.5
```

**Strengths:**
- ✅ Cross-source validation
- ✅ Novelty detection (label vs non-label)
- ✅ Burst detection (temporal anomalies)

**Gaps:**
- ❌ Source types are implicit (just strings in `sources` list)
- ❌ No hierarchical Bayesian consensus (linear average only)
- ❌ Mechanism plausibility is rule-based (not using QSPEngine/LLM)

---

### C. NLP Query Parser

**Location:** `backup/aethersignal/src/nl_query_parser.py`

**Current Implementation:**
- ✅ Pattern matching for drugs, reactions, age groups, dates
- ✅ Negation detection ("no X", "without X")
- ✅ Population groups (elderly=65+, pediatric=<18, adults=18-64)
- ✅ Temporal concepts ("recently", "last 6 months")
- ✅ Severity concepts (life-threatening, hospitalization, disability)
- ✅ Context-aware detection (checks dataset for drug/reaction names)
- ✅ Intent detection (comparison, trend)

**Strengths:**
- ✅ Much smarter than naive regex-only parser
- ✅ Handles complex queries with multiple concepts

**Gaps:**
- ❌ No explicit drug class mappings ("anticoagulants" → [warfarin, apixaban, ...])
- ❌ No explicit event synonym dictionaries ("bleeding" → [hemorrhage, haemorrhage, ...])
- ❌ No LLM fallback for ambiguous queries
- ❌ Intent detection doesn't route to specific workflows

---

### D. Current Fusion Architecture

**Location:** `backend/app/core/signal_detection/complete_fusion_engine.py` → `CompleteFusionEngine`

**Current Implementation:**
```python
# 3-layer fusion
fusion_score = (
    0.35 * bayesian_score +      # Layer 0: Bayesian-Temporal
    0.40 * quantum_layer1 +     # Layer 1: Single-source quantum
    0.25 * quantum_layer2       # Layer 2: Multi-source quantum
)
```

**Strengths:**
- ✅ Clean 3-layer architecture
- ✅ Exact weights from Claude's spec
- ✅ Component breakdown for explainability

**Gaps:**
- ❌ No unified `signal_score()` endpoint (separate quantum vs classical)
- ❌ Disproportionality not explicitly in quantum layer
- ❌ No calibration to historical outcomes

---

## 2️⃣ V2 ENHANCEMENTS - PROPOSED IMPROVEMENTS

### A. Unified Signal Scoring with Explicit Disproportionality

#### **Proposed Schema:**

```python
@dataclass
class UnifiedSignalScore:
    """Complete signal score with all components"""
    
    # Core PV components
    rarity: float                    # 0-1: 1 - (count/total)
    seriousness: float              # 0-1: flags + outcomes + proportions
    recency: float                  # 0-1: time decay
    disproportionality: float       # 0-1: NEW - PRR/ROR/EBGM/IC normalized
    
    # Cross-source components
    frequency: float                # 0-1: case count thresholds
    severity: float                 # 0-1: outcome severity
    burst: float                    # 0-1: temporal anomalies
    novelty: float                  # 0-1: label vs non-label + recency
    consensus: float                # 0-1: multi-source agreement
    mechanism: float                # 0-1: plausibility (LLM-enhanced)
    
    # Interaction terms
    interactions: Dict[str, float]  # rare_serious, rare_recent, etc.
    tunneling_boost: float          # 0-1: near-threshold boosts
    
    # Scores
    quantum_score: float            # 0-1: unified quantum score
    classical_score: float          # 0-1: PRR/ROR/IC normalized
    fusion_score: float             # 0-1: final weighted combination
    
    # Rankings
    quantum_rank: Optional[int]
    classical_rank: Optional[int]
    percentile: Optional[float]
    
    # Alert level
    alert_level: str                # critical/high/moderate/watchlist/low/none
    
    # Explanations
    key_findings: List[str]         # Human-readable explanations
    component_breakdown: Dict[str, float]  # Contribution of each component
```

#### **Proposed Formula:**

```python
def calculate_unified_quantum_score(
    signal: Dict[str, Any],
    classical_metrics: Dict[str, float],  # PRR, ROR, EBGM, IC
    total_cases: int
) -> UnifiedSignalScore:
    """
    Unified quantum score with explicit disproportionality.
    
    Formula:
    quantum_score = (
        w1 * rarity +
        w2 * seriousness +
        w3 * recency +
        w4 * disproportionality +  # NEW
        w5 * frequency +
        w6 * severity +
        w7 * burst +
        w8 * novelty +
        w9 * consensus +
        w10 * mechanism
    ) + interactions + tunneling
    
    Where:
    - w1-w10 are learned/tunable weights (defaults from v1)
    - disproportionality = normalize_disproportionality(PRR, ROR, EBGM, IC)
    """
    
    # 1. Calculate disproportionality component (NEW)
    disproportionality = normalize_disproportionality(
        prr=classical_metrics.get('prr', 1.0),
        ror=classical_metrics.get('ror', 1.0),
        ebgm=classical_metrics.get('ebgm', 1.0),
        ic=classical_metrics.get('ic', 0.0)
    )
    
    # 2. Calculate other components (existing logic)
    rarity = calculate_rarity(signal['count'], total_cases)
    seriousness = calculate_seriousness(signal)
    recency = calculate_recency(signal)
    frequency = calculate_frequency(signal['count'])
    severity = calculate_severity(signal)
    burst = calculate_burst(signal)
    novelty = calculate_novelty(signal, label_reactions)
    consensus = calculate_consensus(signal, sources)
    mechanism = calculate_mechanism(signal, llm_engine)  # Enhanced
    
    # 3. Calculate interactions (existing logic)
    interactions = calculate_interactions(rarity, seriousness, recency)
    tunneling = calculate_tunneling(rarity, seriousness, recency)
    
    # 4. Weighted combination (with learned weights)
    weights = get_learned_weights(customer_id)  # NEW: customer-specific or ML-optimized
    
    quantum_score = (
        weights['rarity'] * rarity +
        weights['seriousness'] * seriousness +
        weights['recency'] * recency +
        weights['disproportionality'] * disproportionality +  # NEW
        weights['frequency'] * frequency +
        weights['severity'] * severity +
        weights['burst'] * burst +
        weights['novelty'] * novelty +
        weights['consensus'] * consensus +
        weights['mechanism'] * mechanism
    ) + sum(interactions.values()) + tunneling
    
    # 5. Classical score (normalized)
    classical_score = normalize_classical_metrics(classical_metrics)
    
    # 6. Fusion score
    fusion_score = (
        0.35 * classical_score +
        0.40 * quantum_score +
        0.25 * consensus  # Multi-source corroboration
    )
    
    return UnifiedSignalScore(...)
```

#### **Disproportionality Normalization Function:**

```python
def normalize_disproportionality(
    prr: float,
    ror: float,
    ebgm: float,
    ic: float
) -> float:
    """
    Normalize PRR/ROR/EBGM/IC into 0-1 disproportionality score.
    
    Strategy: Log-transform + sigmoid to handle wide ranges.
    
    PRR/ROR/EBGM: log-transform, then sigmoid
    IC: Direct sigmoid (already log-scale)
    
    Formula:
    prr_norm = sigmoid(log(prr) / log(10))  # PRR=2 → ~0.5, PRR=10 → ~0.9
    ror_norm = sigmoid(log(ror) / log(10))
    ebgm_norm = sigmoid(log(ebgm) / log(10))
    ic_norm = sigmoid(ic / 3.0)  # IC=0 → 0.5, IC=3 → ~0.9
    
    disproportionality = (prr_norm + ror_norm + ebgm_norm + ic_norm) / 4.0
    """
    import numpy as np
    
    def sigmoid(x):
        return 1 / (1 + np.exp(-x))
    
    # Handle edge cases
    prr = max(prr, 0.1)  # Avoid log(0)
    ror = max(ror, 0.1)
    ebgm = max(ebgm, 0.1)
    
    # Log-transform + sigmoid
    prr_norm = sigmoid(np.log(prr) / np.log(10))
    ror_norm = sigmoid(np.log(ror) / np.log(10))
    ebgm_norm = sigmoid(np.log(ebgm) / np.log(10))
    ic_norm = sigmoid(ic / 3.0)
    
    # Average (or weighted average if preferred)
    return (prr_norm + ror_norm + ebgm_norm + ic_norm) / 4.0
```

---

### B. Calibrated Thresholds (Statistical Validation)

#### **Proposed Calibration Process:**

```python
class ThresholdCalibrator:
    """
    Calibrate quantum score thresholds to historical outcomes.
    
    Process:
    1. Collect historical signals with known outcomes:
       - Regulatory action (FDA warning, label change)
       - Internal escalation (PSUR, PBRER)
       - No action (false positive)
    
    2. Fit logistic regression:
       quantum_score → probability(regulatory_action)
    
    3. Set thresholds:
       - 0.7+ ≈ "signals that historically led to regulatory action"
       - 0.5-0.7 ≈ "signals that led to internal escalation"
       - <0.5 ≈ "background noise"
    """
    
    def calibrate_thresholds(
        self,
        historical_signals: List[Dict],  # {quantum_score, outcome, ...}
        outcome_field: str = "regulatory_action"
    ) -> Dict[str, float]:
        """
        Calibrate thresholds using logistic regression.
        
        Returns:
        {
            "critical_threshold": 0.85,  # 95% probability of action
            "high_threshold": 0.72,      # 80% probability of action
            "moderate_threshold": 0.58,  # 50% probability of action
            "watchlist_threshold": 0.45, # 25% probability of action
        }
        """
        from sklearn.linear_model import LogisticRegression
        import numpy as np
        
        # Prepare data
        X = np.array([[s['quantum_score']] for s in historical_signals])
        y = np.array([1 if s[outcome_field] else 0 for s in historical_signals])
        
        # Fit logistic regression
        model = LogisticRegression()
        model.fit(X, y)
        
        # Find thresholds for target probabilities
        thresholds = {}
        for prob, name in [
            (0.95, "critical_threshold"),
            (0.80, "high_threshold"),
            (0.50, "moderate_threshold"),
            (0.25, "watchlist_threshold"),
        ]:
            # Inverse sigmoid: logit(p) = log(p / (1-p))
            logit = np.log(prob / (1 - prob))
            # Solve: logit = intercept + coef * threshold
            threshold = (logit - model.intercept_[0]) / model.coef_[0][0]
            thresholds[name] = float(np.clip(threshold, 0.0, 1.0))
        
        return thresholds
```

#### **Usage:**

```python
# During initialization
calibrator = ThresholdCalibrator()
historical_data = load_historical_signals()  # From database
thresholds = calibrator.calibrate_thresholds(historical_data)

# In fusion engine
def _determine_alert_level(self, fusion_score: float) -> str:
    if fusion_score >= thresholds["critical_threshold"]:
        return "critical"
    elif fusion_score >= thresholds["high_threshold"]:
        return "high"
    # ... etc
```

---

### C. Enhanced Multi-Source Corroboration

#### **Proposed Source Type System:**

```python
from enum import Enum
from dataclasses import dataclass
from typing import Literal, Dict, Any, Optional

class SourceType(str, Enum):
    """Explicit source types with reliability weights"""
    FAERS = "faers"                    # Weight: 1.0
    OPENFDA = "openfda"                # Weight: 1.0
    SOCIAL = "social"                  # Weight: 0.5
    PUBMED = "pubmed"                  # Weight: 0.7
    CLINICALTRIALS = "clinicaltrials"  # Weight: 0.8
    DAILYMED = "dailymed"              # Weight: 0.9
    EMA = "ema"                        # Weight: 0.9
    YELLOWCARD = "yellowcard"           # Weight: 0.8
    HEALTH_CANADA = "health_canada"     # Weight: 0.8
    RWE = "rwe"                        # Weight: 0.6
    LABEL = "label"                    # Weight: 0.9

SOURCE_RELIABILITY_WEIGHTS = {
    SourceType.FAERS: 1.0,
    SourceType.OPENFDA: 1.0,
    SourceType.SOCIAL: 0.5,
    SourceType.PUBMED: 0.7,
    SourceType.CLINICALTRIALS: 0.8,
    SourceType.DAILYMED: 0.9,
    SourceType.EMA: 0.9,
    SourceType.YELLOWCARD: 0.8,
    SourceType.HEALTH_CANADA: 0.8,
    SourceType.RWE: 0.6,
    SourceType.LABEL: 0.9,
}


@dataclass
class SourceSignal:
    """Typed source signal with metadata"""
    source_type: SourceType
    strength: float  # 0-1: signal strength from this source
    confidence: float  # 0-1: confidence in this source's data quality
    details: Dict[str, Any]  # counts, effect sizes, citations, etc.
    evidence_level: Literal["case_report", "rct", "mechanistic", "label"] = "case_report"
    
    def weighted_strength(self) -> float:
        """Calculate reliability-weighted strength"""
        reliability = SOURCE_RELIABILITY_WEIGHTS[self.source_type]
        return self.strength * reliability * self.confidence


class HierarchicalBayesianConsensus:
    """
    Hierarchical Bayesian consensus model.
    
    Instead of linear average, models:
    - Each source's reliability (prior)
    - Each source's evidence level (case reports vs RCTs)
    - Combined posterior for "true signal vs noise"
    """
    
    def __init__(self):
        # Priors for source reliability (Beta distribution)
        self.source_priors = {
            SourceType.FAERS: (10, 1),      # High reliability
            SourceType.SOCIAL: (2, 8),      # Low reliability
            SourceType.PUBMED: (7, 3),      # Medium-high reliability
            # ... etc
        }
    
    def compute_consensus(
        self,
        source_signals: List[SourceSignal]
    ) -> Dict[str, float]:
        """
        Compute hierarchical Bayesian consensus.
        
        Model:
        - Each source provides evidence: strength ~ Beta(alpha, beta)
        - True signal strength: theta ~ Beta(alpha_combined, beta_combined)
        - Posterior: P(theta | sources) = Beta(alpha + sum(alpha_i), beta + sum(beta_i))
        
        Returns:
        {
            "consensus_score": 0.0-1.0,
            "posterior_mean": 0.0-1.0,
            "posterior_ci_lower": 0.0-1.0,
            "posterior_ci_upper": 0.0-1.0,
            "source_contributions": {...}
        }
        """
        from scipy.stats import beta
        
        # Combine evidence from all sources
        alpha_combined = 0.0
        beta_combined = 0.0
        source_contributions = {}
        
        for signal in source_signals:
            # Convert strength to Beta parameters
            # strength = alpha / (alpha + beta)
            # Use source-specific priors
            alpha_prior, beta_prior = self.source_priors.get(
                signal.source_type, (5, 5)  # Default: uniform
            )
            
            # Update with observed strength
            alpha = alpha_prior + signal.strength * 10  # Scale for precision
            beta = beta_prior + (1 - signal.strength) * 10
            
            alpha_combined += alpha
            beta_combined += beta
            
            source_contributions[signal.source_type.value] = {
                "strength": signal.strength,
                "weight": signal.weighted_strength(),
                "alpha": alpha,
                "beta": beta,
            }
        
        # Compute posterior
        posterior_mean = alpha_combined / (alpha_combined + beta_combined)
        posterior_ci_lower = beta.ppf(0.025, alpha_combined, beta_combined)
        posterior_ci_upper = beta.ppf(0.975, alpha_combined, beta_combined)
        
        return {
            "consensus_score": float(posterior_mean),
            "posterior_mean": float(posterior_mean),
            "posterior_ci_lower": float(posterior_ci_lower),
            "posterior_ci_upper": float(posterior_ci_upper),
            "source_contributions": source_contributions,
        }
```

#### **Enhanced Mechanism Plausibility:**

```python
class EnhancedMechanismScorer:
    """
    LLM-enhanced mechanism plausibility scoring.
    
    Uses QSPEngine + LLM to assess:
    - Drug mechanism of action
    - Event pathophysiology
    - Known associations
    - Literature support
    """
    
    def __init__(self, llm_engine=None, qsp_engine=None):
        self.llm_engine = llm_engine  # Claude/OpenAI API
        self.qsp_engine = qsp_engine  # QSPEngine from your codebase
    
    def compute_mechanism_score(
        self,
        drug: str,
        event: str,
        drug_class: Optional[str] = None,
        moa: Optional[str] = None,
        organ_system: Optional[str] = None,
        literature_citations: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compute mechanism plausibility with LLM explanation.
        
        Returns:
        {
            "mechanism_score": 0.0-1.0,
            "plausibility": "high" | "moderate" | "low" | "unlikely",
            "explanation": "Natural language explanation",
            "key_citations": [...],
            "mechanistic_pathway": "..."
        }
        """
        # 1. Check QSPEngine (if available)
        qsp_score = 0.5
        if self.qsp_engine:
            qsp_result = self.qsp_engine.compute_qsp_scores(...)
            qsp_score = qsp_result.get("mechanism_component", 0.5)
        
        # 2. LLM assessment
        llm_prompt = f"""
        Assess the mechanistic plausibility of this drug-event association:
        
        Drug: {drug}
        Drug Class: {drug_class or "Unknown"}
        Mechanism of Action: {moa or "Unknown"}
        Event: {event}
        Organ System: {organ_system or "Unknown"}
        
        Literature Citations: {literature_citations or "None"}
        
        Provide:
        1. Plausibility score (0-1)
        2. Plausibility level (high/moderate/low/unlikely)
        3. Explanation of mechanism (if plausible)
        4. Key citations supporting/contradicting
        5. Mechanistic pathway (if known)
        """
        
        llm_response = self.llm_engine.generate(llm_prompt)
        
        # Parse LLM response
        mechanism_score = llm_response.get("plausibility_score", 0.5)
        explanation = llm_response.get("explanation", "")
        key_citations = llm_response.get("key_citations", [])
        
        # Combine QSP + LLM (weighted)
        final_score = 0.6 * qsp_score + 0.4 * mechanism_score
        
        return {
            "mechanism_score": float(final_score),
            "plausibility": llm_response.get("plausibility_level", "moderate"),
            "explanation": explanation,
            "key_citations": key_citations,
            "mechanistic_pathway": llm_response.get("mechanistic_pathway", ""),
        }
```

---

### D. LLM-Enhanced NLP Query Parser

#### **Proposed Hybrid Parser:**

```python
class EnhancedQueryInterpreter:
    """
    Hybrid NLP query interpreter: rules + LLM fallback.
    
    Strategy:
    1. Try rule-based parser first (fast, deterministic)
    2. If low confidence, use LLM to propose/adjust filters
    3. Validate LLM output against rules schema
    4. Never let LLM directly query database
    """
    
    def __init__(self, llm_engine=None):
        self.rule_parser = parse_query_to_filters  # Your existing parser
        self.llm_engine = llm_engine
    
    def parse(
        self,
        query: str,
        normalized_df: Optional[pd.DataFrame] = None,
        confidence_threshold: float = 0.7
    ) -> Dict[str, Any]:
        """
        Parse query with rule-based + LLM fallback.
        
        Returns:
        {
            "filters": {...},  # Structured filters
            "confidence": 0.0-1.0,
            "method": "rules" | "llm" | "hybrid",
            "explanation": "..."
        }
        """
        # 1. Try rule-based parser
        rule_filters = self.rule_parser(query, normalized_df)
        rule_confidence = self._estimate_confidence(rule_filters, query)
        
        if rule_confidence >= confidence_threshold:
            return {
                "filters": rule_filters,
                "confidence": rule_confidence,
                "method": "rules",
                "explanation": "Parsed using rule-based patterns"
            }
        
        # 2. LLM fallback
        if self.llm_engine:
            llm_filters = self._llm_parse(query, normalized_df)
            
            # 3. Validate LLM output
            validated_filters = self._validate_llm_output(llm_filters, rule_filters)
            
            return {
                "filters": validated_filters,
                "confidence": 0.8,  # LLM typically higher confidence
                "method": "llm",
                "explanation": llm_filters.get("explanation", "")
            }
        
        # Fallback to rules even if low confidence
        return {
            "filters": rule_filters,
            "confidence": rule_confidence,
            "method": "rules",
            "explanation": "Parsed using rule-based patterns (low confidence)"
        }
    
    def _llm_parse(
        self,
        query: str,
        normalized_df: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """Use LLM to parse query into structured filters"""
        
        # Get available drugs/reactions for context
        available_drugs = []
        available_reactions = []
        if normalized_df is not None:
            available_drugs = normalized_df['drug_name'].unique().tolist()[:100]
            available_reactions = normalized_df['reaction'].unique().tolist()[:100]
        
        prompt = f"""
        Parse this pharmacovigilance query into structured filters:
        
        Query: "{query}"
        
        Available drugs (sample): {available_drugs[:20]}
        Available reactions (sample): {available_reactions[:20]}
        
        Return JSON with:
        {{
            "drug": "drug name or null",
            "reaction": "reaction name or null",
            "age_min": number or null,
            "age_max": number or null,
            "sex": "M" | "F" | null,
            "country": "country name or null",
            "seriousness": true | false | null,
            "date_from": "YYYY-MM-DD or null",
            "date_to": "YYYY-MM-DD or null",
            "exclude_reaction": ["reaction1", ...] or null,
            "intent": "trend" | "comparison" | "search" | null,
            "explanation": "How you parsed this query"
        }}
        """
        
        response = self.llm_engine.generate(prompt)
        return json.loads(response)
    
    def _validate_llm_output(
        self,
        llm_filters: Dict[str, Any],
        rule_filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate LLM output against rules and schema"""
        validated = {}
        
        # Merge LLM + rules (rules take precedence for safety)
        for key in ["drug", "reaction", "age_min", "age_max", "sex", "country"]:
            # Prefer rules if present, else use LLM
            validated[key] = rule_filters.get(key) or llm_filters.get(key)
        
        # Validate ranges
        if validated.get("age_min") and validated.get("age_max"):
            if validated["age_min"] > validated["age_max"]:
                validated["age_max"] = validated["age_min"] + 10
        
        return validated
    
    def _estimate_confidence(
        self,
        filters: Dict[str, Any],
        query: str
    ) -> float:
        """Estimate confidence in rule-based parsing"""
        confidence = 0.5  # Base
        
        # Boost if found explicit keywords
        if filters.get("drug") or filters.get("reaction"):
            confidence += 0.2
        
        # Boost if found structured patterns
        if filters.get("age_min") or filters.get("age_max"):
            confidence += 0.1
        
        if filters.get("date_from") or filters.get("date_to"):
            confidence += 0.1
        
        # Penalize if query is very long (might be ambiguous)
        if len(query.split()) > 20:
            confidence -= 0.1
        
        return max(0.0, min(1.0, confidence))
```

#### **Explicit Dictionaries:**

```python
# Drug class mappings
DRUG_CLASS_MAP = {
    "anticoagulants": [
        "warfarin", "apixaban", "rivaroxaban", "dabigatran",
        "edoxaban", "heparin", "enoxaparin", "fondaparinux"
    ],
    "statins": [
        "atorvastatin", "simvastatin", "rosuvastatin", "pravastatin",
        "lovastatin", "fluvastatin", "pitavastatin"
    ],
    "antihypertensives": [
        "lisinopril", "enalapril", "ramipril", "metoprolol",
        "atenolol", "amlodipine", "losartan", "valsartan"
    ],
    # ... expand as needed
}

# Event synonym mappings (MedDRA-based)
MEDDRA_SYNONYMS = {
    "bleeding": [
        "hemorrhage", "haemorrhage", "blood loss", "epistaxis",
        "gastrointestinal bleeding", "GI bleeding", "hematoma"
    ],
    "cardiac arrest": [
        "heart attack", "myocardial infarction", "MI", "cardiac event",
        "sudden cardiac death", "SCD"
    ],
    "liver failure": [
        "hepatic failure", "liver dysfunction", "hepatotoxicity",
        "elevated liver enzymes", "ALT elevation", "AST elevation"
    ],
    # ... expand as needed
}

# Geography mappings
GEOGRAPHY_MAP = {
    "asian": ["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "PH", "ID"],
    "european": ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE"],
    "north american": ["US", "CA", "MX"],
    "latin american": ["BR", "AR", "CL", "CO", "PE", "VE"],
    # ... expand as needed
}
```

---

### E. Learned Weights (Customer-Specific or ML-Optimized)

#### **Proposed Weight Learning System:**

```python
class WeightLearner:
    """
    Learn optimal weights from historical outcomes.
    
    Options:
    1. Customer-specific tuning (manual override)
    2. ML-optimized (gradient boosting / logistic regression)
    3. Bayesian optimization (hyperparameter tuning)
    """
    
    def __init__(self):
        self.customer_weights = {}  # customer_id -> weights dict
        self.global_weights = self._get_default_weights()
    
    def get_weights(self, customer_id: Optional[str] = None) -> Dict[str, float]:
        """Get weights for customer (or global defaults)"""
        if customer_id and customer_id in self.customer_weights:
            return self.customer_weights[customer_id]
        return self.global_weights
    
    def learn_weights(
        self,
        training_data: List[Dict],  # {features, quantum_score, outcome}
        method: str = "gradient_boosting"
    ) -> Dict[str, float]:
        """
        Learn optimal weights from historical outcomes.
        
        Training data format:
        [
            {
                "rarity": 0.8,
                "seriousness": 0.9,
                "recency": 0.7,
                "disproportionality": 0.85,
                "frequency": 0.6,
                "severity": 0.8,
                "burst": 0.5,
                "novelty": 0.3,
                "consensus": 0.7,
                "mechanism": 0.6,
                "outcome": 1  # 1 = regulatory action, 0 = no action
            },
            ...
        ]
        """
        from sklearn.ensemble import GradientBoostingClassifier
        import numpy as np
        
        # Prepare features
        feature_names = [
            "rarity", "seriousness", "recency", "disproportionality",
            "frequency", "severity", "burst", "novelty", "consensus", "mechanism"
        ]
        
        X = np.array([[d[f] for f in feature_names] for d in training_data])
        y = np.array([d["outcome"] for d in training_data])
        
        # Train model
        model = GradientBoostingClassifier()
        model.fit(X, y)
        
        # Extract feature importances as weights
        importances = model.feature_importances_
        
        # Normalize to sum to 1.0
        importances = importances / importances.sum()
        
        # Convert to weights dict
        weights = dict(zip(feature_names, importances))
        
        return weights
    
    def _get_default_weights(self) -> Dict[str, float]:
        """Default weights from v1"""
        return {
            "rarity": 0.15,           # Reduced from 0.40 (now part of larger system)
            "seriousness": 0.12,      # Reduced from 0.35
            "recency": 0.08,          # Reduced from 0.20
            "disproportionality": 0.20,  # NEW
            "frequency": 0.10,        # From multi-source
            "severity": 0.08,         # From multi-source
            "burst": 0.06,            # From multi-source
            "novelty": 0.06,          # From multi-source
            "consensus": 0.10,        # From multi-source
            "mechanism": 0.05,        # From multi-source
        }
        # Total = 1.0
```

---

## 3️⃣ PROPOSED API SCHEMA

### **Unified Signal Score Endpoint:**

```python
@router.post("/signal-score/unified", response_model=UnifiedSignalScoreResponse)
async def get_unified_signal_score(request: UnifiedSignalScoreRequest):
    """
    Unified signal scoring endpoint.
    
    Combines:
    - Classical disproportionality (PRR/ROR/IC/EBGM)
    - Quantum components (rarity, seriousness, recency, disproportionality)
    - Multi-source corroboration (frequency, severity, burst, novelty, consensus, mechanism)
    
    Returns complete breakdown with explanations.
    """
    pass


class UnifiedSignalScoreRequest(BaseModel):
    drug: str
    event: str
    total_cases: int
    
    # Signal data
    count: int
    seriousness: Optional[str] = None
    serious_count: Optional[int] = None
    outcome: Optional[str] = None
    dates: Optional[List[str]] = None
    
    # Multi-source data
    sources: Optional[List[str]] = None
    source_signals: Optional[List[SourceSignal]] = None  # NEW: Typed sources
    
    # Label knowledge
    label_reactions: Optional[List[str]] = None
    
    # Optional: Pre-computed classical metrics
    prr: Optional[float] = None
    ror: Optional[float] = None
    ebgm: Optional[float] = None
    ic: Optional[float] = None
    
    # Customer-specific weights (optional)
    customer_id: Optional[str] = None


class UnifiedSignalScoreResponse(BaseModel):
    drug: str
    event: str
    
    # Core scores
    quantum_score: float
    classical_score: float
    fusion_score: float
    
    # Component breakdown
    components: ComponentBreakdown
    
    # Rankings
    quantum_rank: Optional[int]
    classical_rank: Optional[int]
    percentile: Optional[float]
    
    # Alert level
    alert_level: str
    
    # Explanations
    key_findings: List[str]
    component_contributions: Dict[str, float]
    
    # Multi-source corroboration
    consensus: Optional[ConsensusResult] = None
    
    # Mechanism plausibility
    mechanism: Optional[MechanismResult] = None


class ComponentBreakdown(BaseModel):
    # Core PV
    rarity: float
    seriousness: float
    recency: float
    disproportionality: float  # NEW
    
    # Multi-source
    frequency: float
    severity: float
    burst: float
    novelty: float
    consensus: float
    mechanism: float
    
    # Interactions
    interactions: Dict[str, float]
    tunneling_boost: float
```

---

## 4️⃣ IMPLEMENTATION ROADMAP

### **Phase 0: Production Readiness (Week 1-2) - CRITICAL**
**Status:** Must complete before V2 enhancements  
**Reference:** Claude's feedback in `backup/ClaudFiles/Quantum Logic/Feedback on V1/`

- [ ] Response models (2h)
- [ ] Batch efficiency (30min)
- [ ] Background tasks (1h)
- [ ] Rate limiting (2h)
- [ ] Caching (3h)
- [ ] Monitoring (4h)
- [ ] Testing + documentation (3h)

**Total:** 2 weeks

---

### **Phase 1: Unified Scoring (Week 3-4)**
- [ ] Add `disproportionality` component to quantum score
- [ ] Create `normalize_disproportionality()` function
- [ ] Update `UnifiedSignalScore` schema
- [ ] Modify `CompleteFusionEngine` to include disproportionality
- [ ] Test with existing signals

### **Phase 2: Calibration (Week 5-6)**
- [ ] Collect historical signal outcomes
- [ ] Implement `ThresholdCalibrator`
- [ ] Fit logistic regression model
- [ ] Update alert level thresholds
- [ ] Validate against test set

### **Phase 3: Enhanced Multi-Source (Week 7-8)**
- [ ] Create `SourceType` enum and `SourceSignal` dataclass
- [ ] Implement `HierarchicalBayesianConsensus`
- [ ] Enhance `MechanismScorer` with LLM
- [ ] Update multi-source scoring to use typed sources
- [ ] Test with multi-source data

### **Phase 4: LLM-Enhanced NLP (Week 9-10)**
- [ ] Create explicit dictionaries (drug classes, event synonyms, geography)
- [ ] Implement `EnhancedQueryInterpreter`
- [ ] Add LLM fallback logic
- [ ] Create validation layer
- [ ] Test with complex queries

### **Phase 5: Learned Weights (Week 11-12)**
- [ ] Implement `WeightLearner`
- [ ] Create training data collection system
- [ ] Train initial model
- [ ] Add customer-specific weight override
- [ ] A/B test learned vs fixed weights

---

## 5️⃣ FILES TO SHARE WITH CLAUDE

### **Current Implementation (V1):**
1. `backend/app/core/signal_detection/complete_fusion_engine.py`
2. `backend/app/api/quantum_fusion_api.py`
3. `backend/app/core/signal_detection/__init__.py`
4. `backend/app/main.py`

### **Reference Files (For Context):**
5. `backup/aethersignal/src/quantum_ranking.py` (original quantum algorithm)
6. `backup/aethersignal/src/ai/multi_source_quantum_scoring.py` (original multi-source)
7. `backup/aethersignal/src/nl_query_parser.py` (original NLP parser)

---

## 6️⃣ SUMMARY FOR CLAUDE

**Message to Claude:**

> "Thank you for the comprehensive feedback! I've reviewed your assessment and implementation guide. Here's my updated plan:
>
> **✅ Acknowledged Your Feedback:**
> - Your 6 critical improvements (response models, batch efficiency, background tasks, rate limiting, caching, monitoring) are now **Phase 0** (2 weeks, must-do before V2)
> - These are production readiness fixes, not algorithmic changes
> - I've integrated them into the roadmap as immediate priorities
>
> **✅ Current Status:**
> I've successfully implemented Phase 4A (3-layer fusion engine) based on your spec. Here's what I have:
>
> **✅ Implemented:**
> - Complete fusion engine with exact weights (35%/40%/25%)
> - Quantum algorithms (rarity/seriousness/recency + interactions/tunneling)
> - Multi-source scoring (frequency/severity/burst/novelty/consensus/mechanism)
> - FastAPI endpoints (`/fusion` and `/fusion/batch`)
>
> **🎯 For V2, I want to upgrade (not just port):**
> 1. **Unified scoring** with explicit disproportionality component
> 2. **Calibrated thresholds** (statistically validated, not heuristic)
> 3. **Enhanced multi-source** (typed sources, hierarchical Bayesian consensus)
> 4. **LLM-enhanced NLP** (rules as safety rails, LLM for complex queries)
> 5. **Learned weights** (customer-specific or ML-optimized)
>
> **📋 This document** (`V2_ENHANCEMENT_PLAN_FOR_CLAUDE.md`) contains:
> - Exact schemas for unified scoring
> - Formulas for disproportionality normalization
> - Calibration methodology
> - Enhanced multi-source architecture
> - LLM-NLP hybrid parser design
> - Weight learning system
>
> **🚀 Next Steps:**
> 1. **Immediate (Phase 0):** Implement your 6 critical improvements (2 weeks)
> 2. **Strategic (V2):** Then proceed with algorithmic enhancements
>
> **Questions for V2 Enhancements:**
> - The disproportionality normalization formula (is log-transform + sigmoid the right approach?)
> - The hierarchical Bayesian consensus model (is Beta distribution appropriate?)
> - The LLM-NLP hybrid architecture (does this align with your vision?)
> - Should Phase 0 improvements be done first, or can we parallelize with V2?
>
> **Files attached:**
> - Current implementation (4 files)
> - Reference files (3 files from original Streamlit)
> - This enhancement plan (updated with your feedback)
> - Your feedback documents (already reviewed)"

---

**END OF DOCUMENT**

