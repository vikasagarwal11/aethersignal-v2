"""
Complete Quantum-Bayesian Fusion Engine
=======================================

Combines three layers into a unified fusion score:
1) Layer 0: Bayesian-Temporal (PRR/ROR/IC, MGPS/EBGM, temporal patterns, causality)
2) Layer 1: Single-source quantum (rarity/seriousness/recency + interactions/tunneling)
3) Layer 2: Multi-source quantum (frequency/severity/burst/novelty/consensus/mechanism)

All thresholds and weights are configurable via the config system.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import logging

from .unified_signal_detection import (
    UnifiedSignalResult,
    UnifiedSignalDetector,
    SignalStrength,
)
from .config import SignalDetectionConfig, config_manager

logger = logging.getLogger(__name__)


# ============================================================================
# Layer 1: Single-Source Quantum Ranking
# ============================================================================

@dataclass
class QuantumFeatures:
    count: float
    rarity: float
    seriousness_score: float
    recency_score: float


@dataclass
class QuantumComponents:
    # Layer 1 components
    rarity: float = 0.0
    seriousness: float = 0.0
    recency: float = 0.0
    count_normalized: float = 0.0

    # Interaction terms
    interaction_rare_serious: float = 0.0
    interaction_rare_recent: float = 0.0
    interaction_serious_recent: float = 0.0
    interaction_all_three: float = 0.0

    # Tunneling boost
    tunneling_boost: float = 0.0

    # Scores
    base_score: float = 0.0
    quantum_score_layer1: float = 0.0

    # Layer 2 components (populated when available)
    frequency: float = 0.0
    severity: float = 0.0
    burst: float = 0.0
    novelty: float = 0.0
    consensus: float = 0.0
    mechanism: float = 0.0
    quantum_score_layer2: float = 0.0


class SingleSourceQuantumScorer:
    """Implements the streamlit-era quantum ranking algorithm with configurable thresholds."""

    def __init__(self, config: Optional[SignalDetectionConfig] = None) -> None:
        """
        Initialize scorer with configuration.
        
        Args:
            config: SignalDetectionConfig instance. If None, uses platform defaults.
        """
        self.config = config or config_manager.platform_config
        self.weights = self.config.layer1_weights

    def extract_features(
        self,
        signal: Dict[str, Any],
        total_cases: int,
    ) -> QuantumFeatures:
        count = float(signal.get("count", 0))

        rarity = 1.0 - (count / total_cases) if total_cases > 0 else 0.0
        rarity = max(0.0, min(1.0, rarity))

        seriousness_score = self._calculate_seriousness_score(signal)
        recency_score = self._calculate_recency_score(signal)

        return QuantumFeatures(
            count=count,
            rarity=rarity,
            seriousness_score=seriousness_score,
            recency_score=recency_score,
        )

    def _calculate_seriousness_score(self, signal: Dict[str, Any]) -> float:
        """Calculate seriousness score using configurable weights."""
        weights = self.config.seriousness_weights
        score = 0.0

        seriousness = signal.get("seriousness")
        if seriousness is not None:
            seriousness_str = str(seriousness).lower().strip()
            if seriousness_str in ["1", "yes", "y", "true", "serious"]:
                score += weights["flag_base"]

        outcome = signal.get("outcome")
        if outcome is not None:
            outcome_str = str(outcome).lower()
            if any(term in outcome_str for term in ["death", "fatal", "died", "deceased"]):
                score += weights["death"]
            elif any(term in outcome_str for term in ["hospital", "hospitalized", "life", "threatening"]):
                score += weights["hospitalization"]
            elif any(term in outcome_str for term in ["disability", "disabled", "permanent"]):
                score += weights["disability"]

        serious_count = signal.get("serious_count", 0)
        total_count = signal.get("count", 1)
        if total_count > 0:
            score += (serious_count / total_count) * weights["serious_fraction"]

        return min(1.0, score)

    def _calculate_recency_score(self, signal: Dict[str, Any]) -> float:
        """Calculate recency score using configurable thresholds."""
        recency_cfg = self.config.recency_config
        dates: List[datetime] = []

        if "dates" in signal and isinstance(signal["dates"], list):
            for date_item in signal["dates"]:
                parsed = self._parse_date(date_item)
                if parsed:
                    dates.append(parsed)

        for key in ["onset_date", "report_date"]:
            if key in signal:
                parsed = self._parse_date(signal[key])
                if parsed:
                    dates.append(parsed)

        if not dates:
            return 0.5

        most_recent = max(dates)
        days_ago = (datetime.now() - most_recent).days
        recent_days = recency_cfg["recent_days"]
        moderate_days = recency_cfg["moderate_days"]

        if days_ago <= recent_days:
            # Exponential decay within recent period
            recency_score = recency_cfg["recent_weight"] - (days_ago / recent_days) * 0.5
        elif days_ago <= moderate_days:
            # Moderate period
            recency_score = recency_cfg["moderate_weight"] - ((days_ago - recent_days) / recent_days) * 0.3
        else:
            # Old cases
            recency_score = max(0.0, recency_cfg["old_weight"] - (days_ago - moderate_days) / 3650.0)

        return max(0.0, min(1.0, recency_score))

    def _parse_date(self, date_val: Any) -> Optional[datetime]:
        if isinstance(date_val, datetime):
            return date_val
        if isinstance(date_val, str):
            try:
                return datetime.fromisoformat(date_val.replace("Z", "+00:00"))
            except Exception:
                return None
        return None

    def calculate_quantum_score(self, features: QuantumFeatures) -> Tuple[float, QuantumComponents]:
        """Calculate quantum score using configurable thresholds and boosts."""
        count = features.count
        rarity = features.rarity
        seriousness = features.seriousness_score
        recency = features.recency_score

        thresholds = self.config.interaction_thresholds
        boosts = self.config.interaction_boosts
        tunneling_cfg = self.config.tunneling_range

        base_score = (
            self.weights["rarity"] * rarity
            + self.weights["seriousness"] * seriousness
            + self.weights["recency"] * recency
            + self.weights["count"] * min(1.0, count / 10.0)
        )

        # Interaction boosts (configurable thresholds)
        interaction_rare_serious = (
            boosts["rare_serious"]
            if rarity > thresholds["rare_serious"] and seriousness > thresholds["rare_serious"]
            else 0.0
        )
        interaction_rare_recent = (
            boosts["rare_recent"]
            if rarity > thresholds["rare_recent"] and recency > thresholds["rare_recent"]
            else 0.0
        )
        interaction_serious_recent = (
            boosts["serious_recent"]
            if seriousness > thresholds["serious_recent"] and recency > thresholds["serious_recent"]
            else 0.0
        )
        interaction_all_three = (
            boosts["all_three"]
            if (
                rarity > thresholds["all_three"]
                and seriousness > thresholds["all_three"]
                and recency > thresholds["all_three"]
            )
            else 0.0
        )

        interaction_term = (
            interaction_rare_serious
            + interaction_rare_recent
            + interaction_serious_recent
            + interaction_all_three
        )

        # Tunneling boost (configurable range)
        tunneling_boost = 0.0
        tunneling_min = tunneling_cfg["min"]
        tunneling_max = tunneling_cfg["max"]
        boost_per_component = tunneling_cfg["boost_per_component"]
        
        if tunneling_min < rarity <= tunneling_max:
            tunneling_boost += boost_per_component
        if tunneling_min < seriousness <= tunneling_max:
            tunneling_boost += boost_per_component
        if tunneling_min < recency <= tunneling_max:
            tunneling_boost += boost_per_component

        quantum_score = max(0.0, base_score + interaction_term + tunneling_boost)

        components = QuantumComponents(
            rarity=rarity,
            seriousness=seriousness,
            recency=recency,
            count_normalized=min(1.0, count / 10.0),
            interaction_rare_serious=interaction_rare_serious,
            interaction_rare_recent=interaction_rare_recent,
            interaction_serious_recent=interaction_serious_recent,
            interaction_all_three=interaction_all_three,
            tunneling_boost=tunneling_boost,
            base_score=base_score,
            quantum_score_layer1=quantum_score,
        )

        return quantum_score, components


# ============================================================================
# Layer 2: Multi-Source Quantum Scoring
# ============================================================================

class MultiSourceQuantumScorer:
    """Implements the multi-source corroboration logic with weighted consensus."""

    def __init__(self, config: Optional[SignalDetectionConfig] = None) -> None:
        """
        Initialize scorer with configuration.
        
        Args:
            config: SignalDetectionConfig instance. If None, uses platform defaults.
        """
        self.config = config or config_manager.platform_config
        self.weights = self.config.layer2_weights
        self.source_priorities = self.config.source_priorities

    def compute_multi_source_score(
        self,
        signal: Dict[str, Any],
        sources: Optional[List[str]] = None,
        label_reactions: Optional[List[str]] = None,
    ) -> Tuple[float, Dict[str, float]]:
        count = signal.get("count", 0)

        frequency = self._compute_frequency_score(count)
        severity = self._compute_severity_score(signal)
        burst = signal.get("burst_score", 0.0)
        novelty = self._compute_novelty_score(signal, label_reactions)
        consensus = self._compute_consensus_score(signal, sources)
        mechanism = signal.get("mechanism_score", 0.5)

        quantum_score = (
            self.weights["frequency"] * frequency
            + self.weights["severity"] * severity
            + self.weights["burst"] * burst
            + self.weights["novelty"] * novelty
            + self.weights["consensus"] * consensus
            + self.weights["mechanism"] * mechanism
        )
        quantum_score = max(0.0, min(1.0, quantum_score))

        components = {
            "frequency": frequency,
            "severity": severity,
            "burst": burst,
            "novelty": novelty,
            "consensus": consensus,
            "mechanism": mechanism,
        }

        return quantum_score, components

    def _compute_frequency_score(self, count: int) -> float:
        """Calculate frequency score using configurable thresholds."""
        if count == 0:
            return 0.0
        
        thresholds = self.config.frequency_thresholds
        # Sort thresholds in descending order
        sorted_thresholds = sorted(
            [(int(k), v["score"]) for k, v in thresholds.items()],
            reverse=True
        )
        
        for threshold_count, score in sorted_thresholds:
            if count >= threshold_count:
                return score
        
        return 0.0

    def _compute_severity_score(self, signal: Dict[str, Any]) -> float:
        if "severity" in signal:
            return float(signal["severity"])
        if "severity_score" in signal:
            return float(signal["severity_score"])

        text = signal.get("text", "")
        if text:
            serious_keywords = ["hospital", "er", "emergency", "severe", "death", "fatal"]
            if any(kw in text.lower() for kw in serious_keywords):
                return 0.7

        return 0.0

    def _compute_novelty_score(
        self,
        signal: Dict[str, Any],
        label_reactions: Optional[List[str]],
    ) -> float:
        """Calculate novelty score using configurable thresholds."""
        novelty_cfg = self.config.novelty_config
        reaction = signal.get("reaction", "")

        # Check if on-label
        is_labeled = False
        if label_reactions:
            is_labeled = any(
                reaction.lower() in known.lower() or known.lower() in reaction.lower()
                for known in label_reactions
            )
        
        if "most_recent_date" in signal:
            try:
                most_recent = datetime.fromisoformat(str(signal["most_recent_date"]))
                days_ago = (datetime.now() - most_recent).days
                
                if not is_labeled:
                    # Off-label: higher novelty scores
                    if days_ago <= novelty_cfg["very_recent_days"]:
                        return 1.0
                    if days_ago <= novelty_cfg["recent_days"]:
                        return 0.8
                    if days_ago <= novelty_cfg["moderate_days"]:
                        return 0.6
                    if days_ago <= novelty_cfg["old_days"]:
                        return 0.4
                    return 0.2
                else:
                    # On-label: lower novelty (but recent spikes still matter)
                    if days_ago <= novelty_cfg["on_label_recent_days"]:
                        return 0.6
                    if days_ago <= novelty_cfg["on_label_moderate_days"]:
                        return 0.4
                    return 0.2
            except Exception:
                return 0.5 if not is_labeled else 0.2

        return 0.5 if not is_labeled else 0.2

    def _compute_consensus_score(
        self,
        signal: Dict[str, Any],
        sources: Optional[List[str]],
    ) -> float:
        """
        Calculate weighted consensus score using source priorities.
        
        Implements ChatGPT's weighted consensus approach:
        - Weight sources by type (FAERS > RWE > ClinicalTrials > PubMed > Social > Label)
        - Boost if 3+ high-confidence sources agree
        """
        if "sources" not in signal:
            return 0.0

        signal_sources = signal.get("sources", [])
        if not signal_sources:
            return 0.0

        # Get source signals with type and confidence
        source_signals = []
        for source in signal_sources:
            # Try to extract source type and confidence from signal
            source_type = self._infer_source_type(source, signal)
            confidence = signal.get("source_confidence", {}).get(source, 0.5)
            strength = signal.get("source_strength", {}).get(source, 0.5)
            
            source_signals.append({
                "type": source_type,
                "confidence": confidence,
                "strength": strength,
            })

        # Normalize source priorities over present source types
        present_types = {s["type"] for s in source_signals}
        present_priorities = {
            t: self.source_priorities.get(t, 0.1)
            for t in present_types
            if t in self.source_priorities
        }
        
        if not present_priorities:
            # Fallback to simple count-based consensus
            unique_sources = len(set(signal_sources))
            available_sources = len(sources) if sources else 7
            consensus = min(unique_sources / available_sources, 1.0)
        else:
            # Normalize priorities
            total_priority = sum(present_priorities.values())
            normalized_priorities = {
                t: p / total_priority
                for t, p in present_priorities.items()
            }
            
            # Calculate weighted consensus
            weighted_strength = 0.0
            high_conf_count = 0
            boost_cfg = self.config.consensus_boost
            
            for source_sig in source_signals:
                source_type = source_sig["type"]
                if source_type in normalized_priorities:
                    weight = normalized_priorities[source_type]
                    confidence = source_sig["confidence"]
                    strength = source_sig["strength"]
                    
                    weighted_strength += weight * strength * max(0.1, confidence)
                    
                    # Count high-confidence sources
                    if (
                        confidence >= boost_cfg["high_conf_threshold"]
                        and strength >= boost_cfg["high_conf_strength_threshold"]
                    ):
                        high_conf_count += 1
            
            consensus = min(1.0, weighted_strength)
            
            # Boost if multiple high-confidence sources agree
            if high_conf_count >= boost_cfg["min_high_conf_sources"]:
                consensus = min(1.0, consensus + boost_cfg["boost_amount"])

        return consensus
    
    def _infer_source_type(self, source: str, signal: Dict[str, Any]) -> str:
        """Infer source type from source name or signal metadata."""
        source_lower = source.lower()
        
        # Check signal metadata first
        source_type_map = signal.get("source_type_map", {})
        if source in source_type_map:
            return source_type_map[source]
        
        # Infer from source name
        if "faers" in source_lower or "fda" in source_lower:
            return "faers"
        elif "rwe" in source_lower or "real-world" in source_lower:
            return "rwe"
        elif "clinical" in source_lower or "trial" in source_lower:
            return "clinicaltrials"
        elif "pubmed" in source_lower or "literature" in source_lower or "pub" in source_lower:
            return "pubmed"
        elif "social" in source_lower or "twitter" in source_lower or "reddit" in source_lower:
            return "social"
        elif "label" in source_lower or "package" in source_lower:
            return "label"
        else:
            # Default to lowest priority
            return "social"


# ============================================================================
# Fusion Engine
# ============================================================================

@dataclass
class CompleteFusionResult:
    drug: str
    event: str
    count: int

    bayesian_result: Optional[Any] = None  # UnifiedSignalResult if available

    quantum_score_layer1: float = 0.0
    quantum_rank: Optional[int] = None
    classical_rank: Optional[int] = None

    quantum_score_layer2: float = 0.0

    fusion_score: float = 0.0

    components: QuantumComponents = field(default_factory=QuantumComponents)

    alert_level: str = "none"

    percentile: Optional[float] = None

    @property
    def classical_score(self) -> Optional[float]:
        """
        Get classical/Bayesian score for compatibility with QueryRouter.
        
        Returns:
            Composite score from bayesian_result if available, None otherwise.
        """
        if self.bayesian_result:
            return getattr(self.bayesian_result, "composite_score", None)
        return None

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "drug": self.drug,
            "event": self.event,
            "count": self.count,
            "quantum_score_layer1": round(self.quantum_score_layer1, 3),
            "quantum_score_layer2": round(self.quantum_score_layer2, 3),
            "fusion_score": round(self.fusion_score, 3),
            "alert_level": self.alert_level,
            "quantum_rank": self.quantum_rank,
            "classical_rank": self.classical_rank,
            "percentile": round(self.percentile, 2) if self.percentile else None,
            "components": {
                "rarity": round(self.components.rarity, 3),
                "seriousness": round(self.components.seriousness, 3),
                "recency": round(self.components.recency, 3),
                "interactions": {
                    "rare_serious": round(self.components.interaction_rare_serious, 3),
                    "rare_recent": round(self.components.interaction_rare_recent, 3),
                    "serious_recent": round(self.components.interaction_serious_recent, 3),
                    "all_three": round(self.components.interaction_all_three, 3),
                },
                "tunneling": round(self.components.tunneling_boost, 3),
                "layer2": {
                    "frequency": round(self.components.frequency, 3),
                    "severity": round(self.components.severity, 3),
                    "burst": round(self.components.burst, 3),
                    "novelty": round(self.components.novelty, 3),
                    "consensus": round(self.components.consensus, 3),
                    "mechanism": round(self.components.mechanism, 3),
                },
            },
        }

        if self.bayesian_result:
            result["bayesian"] = self.bayesian_result.to_dict()

        return result


class CompleteFusionEngine:
    """Combines Bayesian-Temporal + Quantum layers into one fusion score."""

    def __init__(
        self,
        config: Optional[SignalDetectionConfig] = None,
        user_id: Optional[str] = None,
        organization: Optional[str] = None,
    ) -> None:
        """
        Initialize fusion engine with configuration.
        
        Args:
            config: SignalDetectionConfig instance. If None, loads from config manager.
            user_id: User ID for user-level config overrides.
            organization: Organization name for org-level config overrides.
        """
        # Get merged configuration
        if config is None:
            config = config_manager.get_config(
                user_id=user_id,
                organization=organization,
            )
        
        self.config = config
        self.bayesian_detector = UnifiedSignalDetector()
        self.quantum_scorer_layer1 = SingleSourceQuantumScorer(config=config)
        self.quantum_scorer_layer2 = MultiSourceQuantumScorer(config=config)
        self.fusion_weights = config.fusion_weights

    def detect_signal(
        self,
        drug: str,
        event: str,
        signal_data: Dict[str, Any],
        total_cases: int,
        contingency_table: Optional[Any] = None,
        clinical_features: Optional[Any] = None,
        time_series: Optional[Any] = None,
        sources: Optional[List[str]] = None,
        label_reactions: Optional[List[str]] = None,
    ) -> CompleteFusionResult:
        count = signal_data.get("count", 0)

        bayesian_result: Optional[UnifiedSignalResult] = None
        bayesian_score = 0.5

        if contingency_table is not None:
            try:
                bayesian_result = self.bayesian_detector.detect_signal(
                    drug, event, contingency_table, clinical_features, time_series
                )
                bayesian_score = bayesian_result.composite_score
            except Exception:
                logger.exception("Bayesian-Temporal detection failed; falling back to defaults.")

        features = self.quantum_scorer_layer1.extract_features(signal_data, total_cases)
        quantum_score_layer1, components = self.quantum_scorer_layer1.calculate_quantum_score(features)

        quantum_score_layer2 = 0.5
        if sources or "sources" in signal_data:
            quantum_score_layer2, multi_components = self.quantum_scorer_layer2.compute_multi_source_score(
                signal_data, sources, label_reactions
            )
            components.frequency = multi_components["frequency"]
            components.severity = multi_components["severity"]
            components.burst = multi_components["burst"]
            components.novelty = multi_components["novelty"]
            components.consensus = multi_components["consensus"]
            components.mechanism = multi_components["mechanism"]
            components.quantum_score_layer2 = quantum_score_layer2

        fusion_score = (
            self.fusion_weights["bayesian"] * bayesian_score
            + self.fusion_weights["quantum_layer1"] * quantum_score_layer1
            + self.fusion_weights["quantum_layer2"] * quantum_score_layer2
        )
        fusion_score = max(0.0, min(1.0, fusion_score))

        alert_level = self._determine_alert_level(fusion_score)

        return CompleteFusionResult(
            drug=drug,
            event=event,
            count=count,
            bayesian_result=bayesian_result,
            quantum_score_layer1=quantum_score_layer1,
            quantum_score_layer2=quantum_score_layer2,
            fusion_score=fusion_score,
            components=components,
            alert_level=alert_level,
        )

    def detect_signals_batch(
        self,
        signals: List[Dict[str, Any]],
        total_cases: Optional[int] = None,
        sources: Optional[List[str]] = None,
        label_reactions: Optional[List[str]] = None,
    ) -> List[CompleteFusionResult]:
        if not signals:
            return []

        if total_cases is None:
            total_cases = sum(s.get("count", 0) for s in signals)

        results: List[CompleteFusionResult] = []
        for signal in signals:
            result = self.detect_signal(
                drug=signal.get("drug", ""),
                event=signal.get("reaction", ""),
                signal_data=signal,
                total_cases=total_cases,
                sources=sources,
                label_reactions=label_reactions,
            )
            results.append(result)

        results.sort(key=lambda r: r.fusion_score, reverse=True)

        for i, result in enumerate(results):
            result.quantum_rank = i + 1
            result.percentile = 100 * (1 - i / len(results))

        classical_sorted = sorted(results, key=lambda r: r.count, reverse=True)
        for i, result in enumerate(classical_sorted):
            result.classical_rank = i + 1

        return results

    def _determine_alert_level(self, fusion_score: float) -> str:
        """Determine alert level using configurable thresholds."""
        alert_levels = self.config.alert_levels
        
        if fusion_score >= alert_levels["critical"]:
            return "critical"
        if fusion_score >= alert_levels["high"]:
            return "high"
        if fusion_score >= alert_levels["moderate"]:
            return "moderate"
        if fusion_score >= alert_levels["watchlist"]:
            return "watchlist"
        if fusion_score >= alert_levels["low"]:
            return "low"
        return "none"


