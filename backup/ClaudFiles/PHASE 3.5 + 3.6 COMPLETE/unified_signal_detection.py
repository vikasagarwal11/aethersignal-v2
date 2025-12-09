"""
Unified Signal Detection Engine
================================

Comprehensive pharmacovigilance signal detection system that integrates:
- Classical disproportionality (PRR, ROR, IC)
- Bayesian methods (MGPS, EBGM)
- Causality assessment (WHO-UMC, Naranjo)
- Temporal pattern detection
- Signal strength classification

This is the core engine that powers AetherSignal's advanced signal detection.
Ready for integration with quantum scoring and ML layers.

Author: AetherSignal Team
Date: 2024-12-08
Version: 1.0.0
"""

from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

# Import our modular components
from bayesian_signal_detection import (
    BayesianSignalDetector,
    BayesianSignal,
    ContingencyTable,
    SignalStrength
)
from disproportionality_analysis import (
    DisproportionalityAnalyzer,
    DisproportionalityResult
)
from causality_assessment import (
    CausalityAssessor,
    CausalityAssessment,
    ClinicalFeatures
)
from temporal_pattern_detection import (
    TemporalPatternAnalyzer,
    TemporalPatternResult,
    TimeSeriesData
)

logger = logging.getLogger(__name__)


# ============================================================================
# UNIFIED SIGNAL DATA STRUCTURE
# ============================================================================

@dataclass
class UnifiedSignalResult:
    """
    Complete signal detection result combining all methods.
    
    This is the master data structure returned by the unified engine.
    """
    drug: str
    event: str
    
    # Observed data
    observed_count: int
    expected_count: float
    
    # Classical disproportionality
    classical: DisproportionalityResult
    
    # Bayesian methods
    bayesian: BayesianSignal
    
    # Causality assessment (optional)
    causality: Optional[CausalityAssessment] = None
    
    # Temporal patterns (optional)
    temporal: Optional[TemporalPatternResult] = None
    
    # Overall assessment
    is_signal: bool = False
    signal_strength: SignalStrength = SignalStrength.NONE
    confidence_level: float = 0.0
    
    # Signal score (0-1, composite of all methods)
    composite_score: float = 0.0
    
    # Ranking information
    rank: Optional[int] = None
    percentile: Optional[float] = None
    
    # Key findings
    key_findings: List[str] = None
    risk_factors: List[str] = None
    recommendations: List[str] = None
    
    def __post_init__(self):
        if self.key_findings is None:
            self.key_findings = []
        if self.risk_factors is None:
            self.risk_factors = []
        if self.recommendations is None:
            self.recommendations = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        result = {
            "drug": self.drug,
            "event": self.event,
            "observed_count": self.observed_count,
            "expected_count": round(self.expected_count, 2),
            
            # Classical metrics
            "classical": self.classical.to_dict(),
            
            # Bayesian metrics
            "bayesian": self.bayesian.to_dict(),
            
            # Overall assessment
            "assessment": {
                "is_signal": self.is_signal,
                "strength": self.signal_strength.value,
                "confidence": round(self.confidence_level, 3),
                "composite_score": round(self.composite_score, 3)
            },
            
            # Ranking
            "ranking": {
                "rank": self.rank,
                "percentile": round(self.percentile, 2) if self.percentile else None
            },
            
            # Summary
            "summary": {
                "key_findings": self.key_findings,
                "risk_factors": self.risk_factors,
                "recommendations": self.recommendations
            }
        }
        
        # Add causality if available
        if self.causality:
            result["causality"] = self.causality.to_dict()
        
        # Add temporal if available
        if self.temporal:
            result["temporal"] = self.temporal.to_dict()
        
        return result


# ============================================================================
# SIGNAL SCORE CALCULATOR
# ============================================================================

class SignalScoreCalculator:
    """
    Calculates composite signal score from multiple methods.
    
    The composite score is a weighted combination of:
    - Classical disproportionality (30%)
    - Bayesian strength (40%)
    - Temporal patterns (20%)
    - Causality (10%)
    """
    
    @staticmethod
    def calculate_composite_score(
        classical: DisproportionalityResult,
        bayesian: BayesianSignal,
        temporal: Optional[TemporalPatternResult] = None,
        causality: Optional[CausalityAssessment] = None
    ) -> float:
        """
        Calculate composite signal score (0-1).
        
        Args:
            classical: Classical disproportionality result
            bayesian: Bayesian signal result
            temporal: Optional temporal pattern result
            causality: Optional causality assessment
            
        Returns:
            Composite score (0-1)
        """
        score = 0.0
        
        # Classical component (30%)
        classical_score = SignalScoreCalculator._classical_score(classical)
        score += 0.30 * classical_score
        
        # Bayesian component (40%)
        bayesian_score = SignalScoreCalculator._bayesian_score(bayesian)
        score += 0.40 * bayesian_score
        
        # Temporal component (20%)
        if temporal:
            temporal_score = temporal.temporal_risk_score
            score += 0.20 * temporal_score
        else:
            # If no temporal data, redistribute weight to Bayesian
            score += 0.20 * bayesian_score
        
        # Causality component (10%)
        if causality:
            causality_score = causality.causality_confidence
            score += 0.10 * causality_score
        else:
            # If no causality data, redistribute weight to classical
            score += 0.10 * classical_score
        
        return min(score, 1.0)
    
    @staticmethod
    def _classical_score(classical: DisproportionalityResult) -> float:
        """Calculate classical component score"""
        # Count how many methods detect signal
        methods_detecting = sum([
            classical.prr_is_signal,
            classical.ror_is_signal,
            classical.ic_is_signal
        ])
        
        # Base score from detection count
        if methods_detecting == 3:
            base_score = 0.9
        elif methods_detecting == 2:
            base_score = 0.7
        elif methods_detecting == 1:
            base_score = 0.5
        else:
            base_score = 0.2
        
        # Adjust for magnitude
        avg_ratio = (classical.prr + classical.ror) / 2
        if avg_ratio > 5.0:
            magnitude_boost = 0.1
        elif avg_ratio > 3.0:
            magnitude_boost = 0.05
        else:
            magnitude_boost = 0.0
        
        return min(base_score + magnitude_boost, 1.0)
    
    @staticmethod
    def _bayesian_score(bayesian: BayesianSignal) -> float:
        """Calculate Bayesian component score"""
        # Base score from EBGM
        if bayesian.ebgm_lower_ci > 4.0:
            base_score = 0.95
        elif bayesian.ebgm_lower_ci > 2.0:
            base_score = 0.80
        elif bayesian.ebgm_lower_ci > 1.0:
            base_score = 0.60
        else:
            base_score = 0.30
        
        # Adjust for FDR significance
        if bayesian.fdr_significant:
            base_score += 0.05
        
        return min(base_score, 1.0)


# ============================================================================
# KEY FINDINGS GENERATOR
# ============================================================================

class KeyFindingsGenerator:
    """Generates human-readable key findings from signal analysis"""
    
    @staticmethod
    def generate_findings(
        unified_result: UnifiedSignalResult
    ) -> Tuple[List[str], List[str], List[str]]:
        """
        Generate key findings, risk factors, and recommendations.
        
        Args:
            unified_result: Unified signal result
            
        Returns:
            (key_findings, risk_factors, recommendations)
        """
        findings = []
        risk_factors = []
        recommendations = []
        
        # Classical findings
        if unified_result.classical.is_signal:
            methods = []
            if unified_result.classical.prr_is_signal:
                methods.append(f"PRR={unified_result.classical.prr:.2f}")
            if unified_result.classical.ror_is_signal:
                methods.append(f"ROR={unified_result.classical.ror:.2f}")
            if unified_result.classical.ic_is_signal:
                methods.append(f"IC={unified_result.classical.ic:.2f}")
            
            findings.append(f"Disproportionality detected: {', '.join(methods)}")
        
        # Bayesian findings
        if unified_result.bayesian.is_signal:
            findings.append(
                f"Bayesian signal confirmed: EBGM={unified_result.bayesian.ebgm:.2f} "
                f"(EB05={unified_result.bayesian.ebgm_lower_ci:.2f})"
            )
        
        # FDR significance
        if unified_result.bayesian.fdr_significant:
            findings.append("Statistically significant after FDR adjustment")
        
        # Case count
        if unified_result.observed_count >= 10:
            findings.append(f"Substantial case count: {unified_result.observed_count} reports")
        
        # Temporal findings
        if unified_result.temporal:
            if unified_result.temporal.has_recent_spike:
                findings.append("Recent spike in reporting detected")
                risk_factors.append("Sudden increase in case reports")
            
            if unified_result.temporal.trend.direction.value == "increasing":
                findings.append("Increasing trend in reporting")
                risk_factors.append("Growing number of reports over time")
            
            if unified_result.temporal.novelty.is_emerging:
                findings.append("Emerging signal (new drug-event combination)")
                risk_factors.append("Novel adverse event for this drug")
        
        # Causality findings
        if unified_result.causality:
            if unified_result.causality.who_category.value in ["certain", "probable"]:
                findings.append(
                    f"Causality assessment: {unified_result.causality.who_category.value}"
                )
            
            # Add primary causality factors as risk factors
            risk_factors.extend(unified_result.causality.primary_factors)
        
        # Generate recommendations
        if unified_result.signal_strength in [SignalStrength.VERY_STRONG, SignalStrength.STRONG]:
            recommendations.append("Escalate to medical review immediately")
            recommendations.append("Consider regulatory reporting if serious")
            recommendations.append("Evaluate need for product labeling update")
        elif unified_result.signal_strength == SignalStrength.MODERATE:
            recommendations.append("Enhanced monitoring recommended")
            recommendations.append("Gather additional case details")
            recommendations.append("Consider literature review")
        elif unified_result.signal_strength == SignalStrength.WEAK:
            recommendations.append("Continue routine monitoring")
            recommendations.append("Re-evaluate if case count increases")
        else:
            recommendations.append("No immediate action required")
        
        return findings, risk_factors, recommendations


# ============================================================================
# UNIFIED SIGNAL DETECTION ENGINE
# ============================================================================

class UnifiedSignalDetector:
    """
    Complete signal detection engine integrating all methods.
    
    This is the main class that orchestrates all signal detection components.
    """
    
    def __init__(
        self,
        min_count: int = 3,
        estimate_priors: bool = True
    ):
        """
        Args:
            min_count: Minimum observed count to analyze
            estimate_priors: Whether to estimate Bayesian priors from data
        """
        self.min_count = min_count
        self.estimate_priors = estimate_priors
        
        # Initialize component analyzers
        self.classical_analyzer = DisproportionalityAnalyzer(min_count)
        self.bayesian_detector = BayesianSignalDetector(min_count)
        self.causality_assessor = CausalityAssessor()
        self.temporal_analyzer = TemporalPatternAnalyzer()
        
        # Score calculator and findings generator
        self.score_calculator = SignalScoreCalculator()
        self.findings_generator = KeyFindingsGenerator()
    
    def detect_signal(
        self,
        drug: str,
        event: str,
        contingency_table: ContingencyTable,
        clinical_features: Optional[ClinicalFeatures] = None,
        time_series: Optional[TimeSeriesData] = None,
        first_report_date: Optional[datetime] = None,
        latencies: Optional[List[int]] = None
    ) -> UnifiedSignalResult:
        """
        Detect signal using all available methods.
        
        Args:
            drug: Drug name
            event: Event/reaction name
            contingency_table: 2x2 contingency table
            clinical_features: Optional clinical features for causality
            time_series: Optional time series for temporal analysis
            first_report_date: Optional first report date for novelty
            latencies: Optional time-to-onset values
            
        Returns:
            Complete unified signal result
        """
        # Classical disproportionality
        classical = self.classical_analyzer.analyze(drug, event, contingency_table)
        
        # Bayesian methods
        bayesian = self.bayesian_detector.detect_signal(drug, event, contingency_table)
        
        # Causality assessment (if features provided)
        causality = None
        if clinical_features:
            causality = self.causality_assessor.assess(drug, event, clinical_features)
        
        # Temporal analysis (if time series provided)
        temporal = None
        if time_series and first_report_date:
            temporal = self.temporal_analyzer.analyze(
                drug, event, time_series, first_report_date, latencies
            )
        
        # Calculate composite score
        composite_score = self.score_calculator.calculate_composite_score(
            classical, bayesian, temporal, causality
        )
        
        # Determine overall signal status
        is_signal = (classical.is_signal or bayesian.is_signal)
        
        # Determine signal strength (use strongest assessment)
        if bayesian.signal_strength.value == "very_strong":
            signal_strength = SignalStrength.VERY_STRONG
        elif classical.signal_strength.value == "very_strong":
            signal_strength = SignalStrength.VERY_STRONG
        else:
            # Use Bayesian strength as primary
            signal_strength = bayesian.signal_strength
        
        # Calculate confidence
        confidence = max(classical.confidence_level, bayesian.confidence_level)
        if causality:
            confidence = (confidence + causality.causality_confidence) / 2
        
        # Create unified result
        result = UnifiedSignalResult(
            drug=drug,
            event=event,
            observed_count=contingency_table.n11,
            expected_count=contingency_table.expected,
            classical=classical,
            bayesian=bayesian,
            causality=causality,
            temporal=temporal,
            is_signal=is_signal,
            signal_strength=signal_strength,
            confidence_level=confidence,
            composite_score=composite_score
        )
        
        # Generate findings
        findings, risk_factors, recommendations = self.findings_generator.generate_findings(
            result
        )
        result.key_findings = findings
        result.risk_factors = risk_factors
        result.recommendations = recommendations
        
        return result
    
    def detect_signals_batch(
        self,
        drug_event_pairs: List[Tuple[str, str, ContingencyTable]],
        estimate_priors: bool = None
    ) -> List[UnifiedSignalResult]:
        """
        Detect signals for multiple drug-event pairs.
        
        Automatically estimates Bayesian priors from the full dataset.
        
        Args:
            drug_event_pairs: List of (drug, event, contingency_table)
            estimate_priors: Override default prior estimation setting
            
        Returns:
            List of unified signals, sorted by composite score
        """
        if estimate_priors is None:
            estimate_priors = self.estimate_priors
        
        # Estimate Bayesian priors if requested
        if estimate_priors:
            contingency_tables = [ct for _, _, ct in drug_event_pairs]
            self.bayesian_detector.estimate_priors(contingency_tables)
            logger.info("Bayesian priors estimated from dataset")
        
        # Detect signal for each pair
        results = []
        for drug, event, ct in drug_event_pairs:
            result = self.detect_signal(drug, event, ct)
            results.append(result)
        
        # Sort by composite score (descending)
        results.sort(key=lambda r: r.composite_score, reverse=True)
        
        # Assign ranks and percentiles
        total = len(results)
        for i, result in enumerate(results):
            result.rank = i + 1
            result.percentile = 100 * (1 - i / total) if total > 0 else 0
        
        logger.info(f"Analyzed {total} drug-event pairs")
        logger.info(f"Detected {sum(1 for r in results if r.is_signal)} signals")
        
        return results


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    import numpy as np
    
    # Example 1: Strong signal with temporal spike
    print("\n" + "="*80)
    print("EXAMPLE 1: STRONG SIGNAL WITH RECENT SPIKE")
    print("="*80 + "\n")
    
    # Create contingency table
    ct1 = ContingencyTable(n11=85, n10=915, n01=120, n00=9880)
    
    # Create time series (showing recent spike)
    dates = [datetime(2024, 1, 1) + timedelta(days=i*7) for i in range(20)]
    counts = [2, 3, 2, 4, 3, 5, 4, 6, 8, 10, 12, 15, 20, 25, 30, 28, 32, 35, 38, 40]
    time_series = TimeSeriesData(dates=dates, counts=counts)
    
    # Clinical features
    clinical = ClinicalFeatures(
        time_to_onset_days=5,
        dechallenge_result=DechallengeResult.POSITIVE,
        dechallenge_improved=True,
        alternative_causes_present=False,
        event_known_for_drug=True
    )
    
    # Create detector
    detector = UnifiedSignalDetector(min_count=3)
    
    # Detect signal
    result = detector.detect_signal(
        drug="NewAnticoagulant",
        event="Major Bleeding",
        contingency_table=ct1,
        clinical_features=clinical,
        time_series=time_series,
        first_report_date=datetime(2024, 1, 1)
    )
    
    # Print results
    print(f"Drug: {result.drug}")
    print(f"Event: {result.event}")
    print(f"Observed: {result.observed_count}, Expected: {result.expected_count:.1f}\n")
    
    print(f"SIGNAL DETECTED: {result.is_signal}")
    print(f"Signal Strength: {result.signal_strength.value.upper()}")
    print(f"Confidence: {result.confidence_level:.1%}")
    print(f"Composite Score: {result.composite_score:.3f}\n")
    
    print("Key Findings:")
    for finding in result.key_findings:
        print(f"  • {finding}")
    
    print("\nRisk Factors:")
    for factor in result.risk_factors:
        print(f"  ⚠️  {factor}")
    
    print("\nRecommendations:")
    for rec in result.recommendations:
        print(f"  → {rec}")
    
    print("\n" + "="*80)
    print("METRICS BREAKDOWN")
    print("="*80 + "\n")
    
    print("Classical Disproportionality:")
    print(f"  PRR: {result.classical.prr:.2f} (CI: {result.classical.prr_lower_ci:.2f}-{result.classical.prr_upper_ci:.2f})")
    print(f"  ROR: {result.classical.ror:.2f} (CI: {result.classical.ror_lower_ci:.2f}-{result.classical.ror_upper_ci:.2f})")
    print(f"  IC: {result.classical.ic:.2f} (CI: {result.classical.ic_lower_ci:.2f}-{result.classical.ic_upper_ci:.2f})")
    
    print("\nBayesian Methods:")
    print(f"  EBGM: {result.bayesian.ebgm:.2f} (EB05: {result.bayesian.ebgm_lower_ci:.2f})")
    print(f"  MGPS: {result.bayesian.mgps_score:.2f}")
    print(f"  FDR Significant: {result.bayesian.fdr_significant}")
    
    if result.causality:
        print("\nCausality:")
        print(f"  WHO-UMC: {result.causality.who_category.value.upper()}")
        print(f"  Naranjo Score: {result.causality.naranjo_score}")
    
    if result.temporal:
        print("\nTemporal Patterns:")
        print(f"  Trend: {result.temporal.trend.direction.value.upper()}")
        print(f"  Recent Spike: {result.temporal.has_recent_spike}")
        print(f"  Temporal Risk: {result.temporal.temporal_risk_score:.2f}")
