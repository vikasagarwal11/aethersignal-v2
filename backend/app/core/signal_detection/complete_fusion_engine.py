"""
Complete Quantum-Bayesian Fusion Engine
=======================================

Combines three layers into a unified fusion score:
1) Layer 0: Bayesian-Temporal (PRR/ROR/IC, MGPS/EBGM, temporal patterns, causality)
2) Layer 1: Single-source quantum (rarity/seriousness/recency + interactions/tunneling)
3) Layer 2: Multi-source quantum (frequency/severity/burst/novelty/consensus/mechanism)
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
    """Implements the streamlit-era quantum ranking algorithm."""

    def __init__(self) -> None:
        self.weights = {
            "rarity": 0.40,
            "seriousness": 0.35,
            "recency": 0.20,
            "count": 0.05,
        }
        # interaction thresholds are encoded directly in calculate_quantum_score

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
        score = 0.0

        seriousness = signal.get("seriousness")
        if seriousness is not None:
            seriousness_str = str(seriousness).lower().strip()
            if seriousness_str in ["1", "yes", "y", "true", "serious"]:
                score += 0.5

        outcome = signal.get("outcome")
        if outcome is not None:
            outcome_str = str(outcome).lower()
            if any(term in outcome_str for term in ["death", "fatal", "died", "deceased"]):
                score += 0.5
            elif any(term in outcome_str for term in ["hospital", "hospitalized", "life", "threatening"]):
                score += 0.3
            elif any(term in outcome_str for term in ["disability", "disabled", "permanent"]):
                score += 0.2

        serious_count = signal.get("serious_count", 0)
        total_count = signal.get("count", 1)
        if total_count > 0:
            score += (serious_count / total_count) * 0.3

        return min(1.0, score)

    def _calculate_recency_score(self, signal: Dict[str, Any]) -> float:
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

        if days_ago <= 365:
            recency_score = 1.0 - (days_ago / 365.0) * 0.5
        elif days_ago <= 730:
            recency_score = 0.5 - ((days_ago - 365) / 365.0) * 0.3
        else:
            recency_score = max(0.0, 0.2 - (days_ago - 730) / 3650.0)

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
        count = features.count
        rarity = features.rarity
        seriousness = features.seriousness_score
        recency = features.recency_score

        base_score = (
            self.weights["rarity"] * rarity
            + self.weights["seriousness"] * seriousness
            + self.weights["recency"] * recency
            + self.weights["count"] * min(1.0, count / 10.0)
        )

        interaction_rare_serious = 0.15 if rarity > 0.7 and seriousness > 0.5 else 0.0
        interaction_rare_recent = 0.10 if rarity > 0.7 and recency > 0.7 else 0.0
        interaction_serious_recent = 0.10 if seriousness > 0.7 and recency > 0.7 else 0.0
        interaction_all_three = 0.20 if rarity > 0.6 and seriousness > 0.6 and recency > 0.6 else 0.0

        interaction_term = (
            interaction_rare_serious
            + interaction_rare_recent
            + interaction_serious_recent
            + interaction_all_three
        )

        tunneling_boost = 0.0
        if 0.5 < rarity <= 0.7:
            tunneling_boost += 0.05
        if 0.5 < seriousness <= 0.7:
            tunneling_boost += 0.05
        if 0.5 < recency <= 0.7:
            tunneling_boost += 0.05

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
    """Implements the multi-source corroboration logic."""

    def __init__(self) -> None:
        self.weights = {
            "frequency": 0.25,
            "severity": 0.20,
            "burst": 0.15,
            "novelty": 0.15,
            "consensus": 0.15,
            "mechanism": 0.10,
        }

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
        if count == 0:
            return 0.0
        if count >= 100:
            return 1.0
        if count >= 50:
            return 0.8
        if count >= 20:
            return 0.6
        if count >= 10:
            return 0.4
        if count >= 5:
            return 0.3
        if count >= 3:
            return 0.2
        return 0.1

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
        reaction = signal.get("reaction", "")

        if label_reactions:
            is_labeled = any(
                reaction.lower() in known.lower() or known.lower() in reaction.lower()
                for known in label_reactions
            )
            if is_labeled:
                return 0.0

        if "most_recent_date" in signal:
            try:
                most_recent = datetime.fromisoformat(str(signal["most_recent_date"]))
                days_ago = (datetime.now() - most_recent).days
                if days_ago <= 30:
                    return 1.0
                if days_ago <= 90:
                    return 0.8
                if days_ago <= 180:
                    return 0.6
                if days_ago <= 365:
                    return 0.4
                return 0.2
            except Exception:
                return 0.5

        return 0.5

    def _compute_consensus_score(
        self,
        signal: Dict[str, Any],
        sources: Optional[List[str]],
    ) -> float:
        if "sources" not in signal:
            return 0.0

        unique_sources = len(set(signal["sources"]))
        available_sources = len(sources) if sources else 7

        consensus = min(unique_sources / available_sources, 1.0)

        if signal.get("high_conf_source_count", 0) >= 3:
            consensus = min(consensus + 0.2, 1.0)

        return consensus


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

    def __init__(self) -> None:
        self.bayesian_detector = UnifiedSignalDetector()
        self.quantum_scorer_layer1 = SingleSourceQuantumScorer()
        self.quantum_scorer_layer2 = MultiSourceQuantumScorer()

        self.fusion_weights = {
            "bayesian": 0.35,
            "quantum_layer1": 0.40,
            "quantum_layer2": 0.25,
        }

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
        if fusion_score >= 0.95:
            return "critical"
        if fusion_score >= 0.80:
            return "high"
        if fusion_score >= 0.65:
            return "moderate"
        if fusion_score >= 0.45:
            return "watchlist"
        if fusion_score >= 0.25:
            return "low"
        return "none"


