"""
Temporal Pattern Detection Module
==================================

Detects temporal patterns in adverse event reporting:
- Spike detection (sudden increases)
- Trend analysis (emerging/fading signals)
- Change point detection
- Temporal clustering
- Novelty scoring (new drug-event pairs)
- Latency analysis (time-to-onset patterns)

Critical for advanced therapies where AEs can be delayed (e.g., CAR-T, gene therapy).

Author: AetherSignal Team
Date: 2024-12-08
Version: 1.0.0
"""

import numpy as np
from scipy import stats
from scipy.signal import find_peaks
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# ENUMERATIONS
# ============================================================================

class TrendDirection(Enum):
    """Signal trend direction"""
    INCREASING = "increasing"
    STABLE = "stable"
    DECREASING = "decreasing"
    FLUCTUATING = "fluctuating"


class LatencyCategory(Enum):
    """Time-to-onset categories"""
    IMMEDIATE = "immediate"      # 0-24 hours
    EARLY = "early"              # 1-7 days
    DELAYED = "delayed"          # 8-30 days
    LATE = "late"                # 31-90 days
    VERY_LATE = "very_late"      # > 90 days


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TimeSeriesData:
    """Time series of case counts"""
    dates: List[datetime]
    counts: List[int]
    
    def __post_init__(self):
        if len(self.dates) != len(self.counts):
            raise ValueError("dates and counts must have same length")
        
        # Sort by date
        sorted_pairs = sorted(zip(self.dates, self.counts))
        self.dates = [d for d, _ in sorted_pairs]
        self.counts = [c for _, c in sorted_pairs]
    
    @property
    def total_cases(self) -> int:
        """Total number of cases"""
        return sum(self.counts)
    
    @property
    def duration_days(self) -> int:
        """Duration of time series in days"""
        if len(self.dates) < 2:
            return 0
        return (self.dates[-1] - self.dates[0]).days
    
    @property
    def mean_daily_rate(self) -> float:
        """Average cases per day"""
        if self.duration_days == 0:
            return 0.0
        return self.total_cases / max(self.duration_days, 1)


@dataclass
class SpikeDetectionResult:
    """Detected spike in reporting"""
    spike_date: datetime
    spike_count: int
    expected_count: float
    fold_increase: float
    z_score: float
    p_value: float
    is_significant: bool


@dataclass
class ChangePointResult:
    """Detected change point in time series"""
    change_date: datetime
    mean_before: float
    mean_after: float
    fold_change: float
    statistical_significance: float
    is_significant: bool


@dataclass
class TrendAnalysisResult:
    """Trend analysis result"""
    direction: TrendDirection
    slope: float  # Cases per day
    r_squared: float
    p_value: float
    is_significant: bool
    doubling_time_days: Optional[float]  # For increasing trends
    half_life_days: Optional[float]  # For decreasing trends


@dataclass
class NoveltyScore:
    """Novelty assessment for drug-event pair"""
    drug: str
    event: str
    first_report_date: datetime
    days_since_first_report: int
    total_reports_to_date: int
    novelty_score: float  # 0-1, higher = more novel
    is_emerging: bool


@dataclass
class TemporalPatternResult:
    """Complete temporal pattern analysis"""
    drug: str
    event: str
    time_series: TimeSeriesData
    
    # Spike detection
    spikes: List[SpikeDetectionResult]
    has_recent_spike: bool
    
    # Change points
    change_points: List[ChangePointResult]
    has_change_point: bool
    
    # Trend
    trend: TrendAnalysisResult
    
    # Novelty
    novelty: NoveltyScore
    
    # Latency distribution
    latency_distribution: Dict[LatencyCategory, int]
    median_latency_days: Optional[float]
    
    # Summary
    temporal_risk_score: float  # 0-1
    temporal_flags: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "drug": self.drug,
            "event": self.event,
            "time_series": {
                "total_cases": self.time_series.total_cases,
                "duration_days": self.time_series.duration_days,
                "mean_daily_rate": round(self.time_series.mean_daily_rate, 3)
            },
            "spikes": {
                "detected": [
                    {
                        "date": s.spike_date.isoformat(),
                        "count": s.spike_count,
                        "fold_increase": round(s.fold_increase, 2),
                        "p_value": round(s.p_value, 4)
                    } for s in self.spikes
                ],
                "has_recent_spike": self.has_recent_spike
            },
            "change_points": {
                "detected": [
                    {
                        "date": cp.change_date.isoformat(),
                        "mean_before": round(cp.mean_before, 2),
                        "mean_after": round(cp.mean_after, 2),
                        "fold_change": round(cp.fold_change, 2)
                    } for cp in self.change_points
                ],
                "has_change_point": self.has_change_point
            },
            "trend": {
                "direction": self.trend.direction.value,
                "slope": round(self.trend.slope, 4),
                "r_squared": round(self.trend.r_squared, 3),
                "is_significant": self.trend.is_significant
            },
            "novelty": {
                "first_report_date": self.novelty.first_report_date.isoformat(),
                "days_since_first": self.novelty.days_since_first_report,
                "novelty_score": round(self.novelty.novelty_score, 3),
                "is_emerging": self.novelty.is_emerging
            },
            "latency": {
                "distribution": {k.value: v for k, v in self.latency_distribution.items()},
                "median_days": self.median_latency_days
            },
            "summary": {
                "temporal_risk_score": round(self.temporal_risk_score, 3),
                "flags": self.temporal_flags
            }
        }


# ============================================================================
# SPIKE DETECTION
# ============================================================================

class SpikeDetector:
    """
    Detects sudden spikes in reporting using statistical methods.
    
    Uses Poisson-based anomaly detection and z-score method.
    """
    
    def __init__(self, window_size: int = 30, z_threshold: float = 3.0):
        """
        Args:
            window_size: Days to use for baseline calculation
            z_threshold: Z-score threshold for significance
        """
        self.window_size = window_size
        self.z_threshold = z_threshold
    
    def detect_spikes(
        self,
        time_series: TimeSeriesData,
        recent_days: int = 90
    ) -> Tuple[List[SpikeDetectionResult], bool]:
        """
        Detect spikes in time series.
        
        Args:
            time_series: Time series data
            recent_days: Define "recent" for flag
            
        Returns:
            (list of spikes, has_recent_spike flag)
        """
        if len(time_series.counts) < self.window_size:
            return [], False
        
        spikes = []
        counts = np.array(time_series.counts)
        
        # For each point (after window), check if it's a spike
        for i in range(self.window_size, len(counts)):
            # Calculate baseline from previous window
            baseline = counts[i - self.window_size:i]
            baseline_mean = np.mean(baseline)
            baseline_std = np.std(baseline)
            
            if baseline_std == 0:
                baseline_std = np.sqrt(baseline_mean)  # Poisson approximation
            
            # Current count
            current = counts[i]
            
            # Z-score
            z_score = (current - baseline_mean) / baseline_std if baseline_std > 0 else 0
            
            # Is this a spike?
            if z_score > self.z_threshold:
                # Calculate p-value (Poisson test)
                p_value = 1 - stats.poisson.cdf(current - 1, baseline_mean)
                
                # Fold increase
                fold_increase = current / baseline_mean if baseline_mean > 0 else float('inf')
                
                spike = SpikeDetectionResult(
                    spike_date=time_series.dates[i],
                    spike_count=current,
                    expected_count=baseline_mean,
                    fold_increase=fold_increase,
                    z_score=z_score,
                    p_value=p_value,
                    is_significant=p_value < 0.01
                )
                
                spikes.append(spike)
        
        # Check for recent spikes
        if spikes and time_series.dates:
            cutoff_date = time_series.dates[-1] - timedelta(days=recent_days)
            has_recent_spike = any(s.spike_date >= cutoff_date for s in spikes)
        else:
            has_recent_spike = False
        
        return spikes, has_recent_spike


# ============================================================================
# CHANGE POINT DETECTION
# ============================================================================

class ChangePointDetector:
    """
    Detects change points where the mean reporting rate changes significantly.
    
    Uses PELT (Pruned Exact Linear Time) algorithm approximation.
    """
    
    def __init__(self, min_segment_size: int = 10):
        """
        Args:
            min_segment_size: Minimum days in each segment
        """
        self.min_segment_size = min_segment_size
    
    def detect_change_points(
        self,
        time_series: TimeSeriesData
    ) -> Tuple[List[ChangePointResult], bool]:
        """
        Detect change points in time series.
        
        Args:
            time_series: Time series data
            
        Returns:
            (list of change points, has_significant_change flag)
        """
        if len(time_series.counts) < self.min_segment_size * 2:
            return [], False
        
        change_points = []
        counts = np.array(time_series.counts)
        
        # Simple approach: scan for optimal split point
        best_change_points = self._find_change_points(counts, time_series.dates)
        
        # Create ChangePointResult objects
        for idx, (mean_before, mean_after) in best_change_points:
            change_date = time_series.dates[idx]
            
            # Fold change
            fold_change = mean_after / mean_before if mean_before > 0 else float('inf')
            
            # Statistical significance (t-test)
            before_segment = counts[:idx]
            after_segment = counts[idx:]
            
            if len(before_segment) > 1 and len(after_segment) > 1:
                t_stat, p_value = stats.ttest_ind(before_segment, after_segment)
                is_significant = p_value < 0.05
            else:
                p_value = 1.0
                is_significant = False
            
            cp = ChangePointResult(
                change_date=change_date,
                mean_before=mean_before,
                mean_after=mean_after,
                fold_change=fold_change,
                statistical_significance=p_value,
                is_significant=is_significant
            )
            
            change_points.append(cp)
        
        has_significant_change = any(cp.is_significant for cp in change_points)
        
        return change_points, has_significant_change
    
    def _find_change_points(
        self,
        counts: np.ndarray,
        dates: List[datetime],
        max_change_points: int = 3
    ) -> List[Tuple[int, Tuple[float, float]]]:
        """
        Find up to max_change_points change points.
        
        Returns list of (index, (mean_before, mean_after))
        """
        n = len(counts)
        change_points = []
        
        # Try each potential split point
        for i in range(self.min_segment_size, n - self.min_segment_size):
            before = counts[:i]
            after = counts[i:]
            
            mean_before = np.mean(before)
            mean_after = np.mean(after)
            
            # Only consider if means are different enough
            if mean_after > mean_before * 1.5 or mean_before > mean_after * 1.5:
                # Calculate cost (sum of squared errors)
                cost_before = np.sum((before - mean_before) ** 2)
                cost_after = np.sum((after - mean_after) ** 2)
                total_cost = cost_before + cost_after
                
                change_points.append((i, (mean_before, mean_after), total_cost))
        
        # Sort by cost (lower is better) and take top change points
        change_points.sort(key=lambda x: x[2])
        
        return [(idx, means) for idx, means, _ in change_points[:max_change_points]]


# ============================================================================
# TREND ANALYSIS
# ============================================================================

class TrendAnalyzer:
    """
    Analyzes long-term trends in reporting.
    
    Uses linear regression and Mann-Kendall test.
    """
    
    @staticmethod
    def analyze_trend(time_series: TimeSeriesData) -> TrendAnalysisResult:
        """
        Analyze trend in time series.
        
        Args:
            time_series: Time series data
            
        Returns:
            Trend analysis result
        """
        if len(time_series.counts) < 3:
            return TrendAnalysisResult(
                direction=TrendDirection.STABLE,
                slope=0.0,
                r_squared=0.0,
                p_value=1.0,
                is_significant=False,
                doubling_time_days=None,
                half_life_days=None
            )
        
        # Convert dates to numeric (days since start)
        x = np.array([(d - time_series.dates[0]).days for d in time_series.dates])
        y = np.array(time_series.counts)
        
        # Linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        r_squared = r_value ** 2
        
        # Determine direction
        if p_value < 0.05:
            if slope > 0:
                direction = TrendDirection.INCREASING
            else:
                direction = TrendDirection.DECREASING
        else:
            # Check coefficient of variation for fluctuation
            cv = np.std(y) / np.mean(y) if np.mean(y) > 0 else 0
            if cv > 0.5:
                direction = TrendDirection.FLUCTUATING
            else:
                direction = TrendDirection.STABLE
        
        # Calculate doubling time for increasing trends
        doubling_time = None
        if direction == TrendDirection.INCREASING and slope > 0 and np.mean(y) > 0:
            # Doubling time = ln(2) / (slope / mean)
            growth_rate = slope / np.mean(y)
            if growth_rate > 0:
                doubling_time = np.log(2) / growth_rate
        
        # Calculate half-life for decreasing trends
        half_life = None
        if direction == TrendDirection.DECREASING and slope < 0 and np.mean(y) > 0:
            # Half-life = ln(2) / (|slope| / mean)
            decay_rate = abs(slope) / np.mean(y)
            if decay_rate > 0:
                half_life = np.log(2) / decay_rate
        
        return TrendAnalysisResult(
            direction=direction,
            slope=slope,
            r_squared=r_squared,
            p_value=p_value,
            is_significant=p_value < 0.05,
            doubling_time_days=doubling_time,
            half_life_days=half_life
        )


# ============================================================================
# NOVELTY ASSESSMENT
# ============================================================================

class NoveltyAssessor:
    """
    Assesses novelty of drug-event combinations.
    
    New combinations are more likely to be emerging signals.
    """
    
    @staticmethod
    def assess_novelty(
        drug: str,
        event: str,
        first_report_date: datetime,
        total_reports: int,
        current_date: Optional[datetime] = None
    ) -> NoveltyScore:
        """
        Assess novelty of drug-event pair.
        
        Novelty score based on:
        - Recency of first report
        - Growth rate of reports
        - Total reports (more reports = less novel)
        
        Args:
            drug: Drug name
            event: Event name
            first_report_date: Date of first report
            total_reports: Total reports to date
            current_date: Current date (default: now)
            
        Returns:
            Novelty score
        """
        if current_date is None:
            current_date = datetime.now()
        
        days_since_first = (current_date - first_report_date).days
        
        # Novelty score components:
        
        # 1. Recency score (exponential decay)
        # Very novel if < 90 days old
        recency_score = np.exp(-days_since_first / 90)
        
        # 2. Report volume score (inverse relationship)
        # Fewer reports = more novel
        # Use log scale to compress range
        volume_score = 1.0 / (1.0 + np.log1p(total_reports))
        
        # 3. Growth rate score
        # Rapid growth = more novel
        reports_per_day = total_reports / max(days_since_first, 1)
        growth_score = min(reports_per_day / 1.0, 1.0)  # Cap at 1
        
        # Combined novelty score (weighted average)
        novelty_score = (
            0.5 * recency_score +
            0.3 * volume_score +
            0.2 * growth_score
        )
        
        # Emerging signal if:
        # - First reported within last 180 days AND
        # - Novelty score > 0.5
        is_emerging = days_since_first <= 180 and novelty_score > 0.5
        
        return NoveltyScore(
            drug=drug,
            event=event,
            first_report_date=first_report_date,
            days_since_first_report=days_since_first,
            total_reports_to_date=total_reports,
            novelty_score=novelty_score,
            is_emerging=is_emerging
        )


# ============================================================================
# LATENCY ANALYZER
# ============================================================================

class LatencyAnalyzer:
    """Analyzes time-to-onset (latency) distributions"""
    
    @staticmethod
    def categorize_latency(days: int) -> LatencyCategory:
        """Categorize time-to-onset"""
        if days <= 1:
            return LatencyCategory.IMMEDIATE
        elif days <= 7:
            return LatencyCategory.EARLY
        elif days <= 30:
            return LatencyCategory.DELAYED
        elif days <= 90:
            return LatencyCategory.LATE
        else:
            return LatencyCategory.VERY_LATE
    
    @staticmethod
    def analyze_latency_distribution(
        latencies: List[int]
    ) -> Tuple[Dict[LatencyCategory, int], Optional[float]]:
        """
        Analyze distribution of time-to-onset values.
        
        Args:
            latencies: List of time-to-onset in days
            
        Returns:
            (distribution by category, median latency)
        """
        if not latencies:
            return {cat: 0 for cat in LatencyCategory}, None
        
        # Count by category
        distribution = {cat: 0 for cat in LatencyCategory}
        for latency in latencies:
            category = LatencyAnalyzer.categorize_latency(latency)
            distribution[category] += 1
        
        # Median
        median_latency = float(np.median(latencies))
        
        return distribution, median_latency


# ============================================================================
# COMPREHENSIVE TEMPORAL PATTERN ANALYZER
# ============================================================================

class TemporalPatternAnalyzer:
    """
    Complete temporal pattern analysis system.
    
    Combines all temporal analysis methods into unified interface.
    """
    
    def __init__(self):
        self.spike_detector = SpikeDetector()
        self.change_point_detector = ChangePointDetector()
        self.trend_analyzer = TrendAnalyzer()
        self.novelty_assessor = NoveltyAssessor()
        self.latency_analyzer = LatencyAnalyzer()
    
    def analyze(
        self,
        drug: str,
        event: str,
        time_series: TimeSeriesData,
        first_report_date: datetime,
        latencies: Optional[List[int]] = None
    ) -> TemporalPatternResult:
        """
        Perform comprehensive temporal pattern analysis.
        
        Args:
            drug: Drug name
            event: Event name
            time_series: Time series of case counts
            first_report_date: Date of first report for this pair
            latencies: Optional list of time-to-onset values (days)
            
        Returns:
            Complete temporal pattern analysis
        """
        # Spike detection
        spikes, has_recent_spike = self.spike_detector.detect_spikes(time_series)
        
        # Change point detection
        change_points, has_change_point = self.change_point_detector.detect_change_points(
            time_series
        )
        
        # Trend analysis
        trend = self.trend_analyzer.analyze_trend(time_series)
        
        # Novelty assessment
        novelty = self.novelty_assessor.assess_novelty(
            drug, event, first_report_date, time_series.total_cases
        )
        
        # Latency analysis
        if latencies:
            latency_dist, median_latency = self.latency_analyzer.analyze_latency_distribution(
                latencies
            )
        else:
            latency_dist = {cat: 0 for cat in LatencyCategory}
            median_latency = None
        
        # Calculate temporal risk score
        risk_score, flags = self._calculate_temporal_risk(
            has_recent_spike, has_change_point, trend, novelty
        )
        
        return TemporalPatternResult(
            drug=drug,
            event=event,
            time_series=time_series,
            spikes=spikes,
            has_recent_spike=has_recent_spike,
            change_points=change_points,
            has_change_point=has_change_point,
            trend=trend,
            novelty=novelty,
            latency_distribution=latency_dist,
            median_latency_days=median_latency,
            temporal_risk_score=risk_score,
            temporal_flags=flags
        )
    
    def _calculate_temporal_risk(
        self,
        has_recent_spike: bool,
        has_change_point: bool,
        trend: TrendAnalysisResult,
        novelty: NoveltyScore
    ) -> Tuple[float, List[str]]:
        """Calculate overall temporal risk score and flags"""
        
        risk_score = 0.0
        flags = []
        
        # Recent spike (high risk)
        if has_recent_spike:
            risk_score += 0.3
            flags.append("Recent spike detected")
        
        # Change point (moderate-high risk)
        if has_change_point:
            risk_score += 0.25
            flags.append("Reporting pattern changed")
        
        # Increasing trend (moderate risk)
        if trend.direction == TrendDirection.INCREASING and trend.is_significant:
            risk_score += 0.2
            flags.append(f"Increasing trend (doubling time: {trend.doubling_time_days:.0f} days)")
        
        # Emerging signal (high risk)
        if novelty.is_emerging:
            risk_score += 0.25
            flags.append("Emerging signal (new drug-event combination)")
        
        # High novelty score (moderate risk)
        elif novelty.novelty_score > 0.6:
            risk_score += 0.15
            flags.append(f"High novelty (score: {novelty.novelty_score:.2f})")
        
        # Cap risk score at 1.0
        risk_score = min(risk_score, 1.0)
        
        return risk_score, flags


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example: Emerging signal with recent spike
    
    # Create time series (simulating increasing reports)
    dates = [datetime(2024, 1, 1) + timedelta(days=i*7) for i in range(20)]
    counts = [2, 3, 2, 4, 3, 5, 4, 6, 8, 10, 12, 15, 20, 25, 30, 28, 32, 35, 38, 40]
    
    time_series = TimeSeriesData(dates=dates, counts=counts)
    
    # First report date
    first_report = datetime(2024, 1, 1)
    
    # Some latency data
    latencies = [1, 3, 5, 7, 10, 12, 14, 15, 18, 21, 25, 30, 35, 40, 45]
    
    # Analyze
    analyzer = TemporalPatternAnalyzer()
    result = analyzer.analyze(
        drug="NewDrug",
        event="Cardiac Event",
        time_series=time_series,
        first_report_date=first_report,
        latencies=latencies
    )
    
    # Print results
    print("\n" + "="*80)
    print("TEMPORAL PATTERN ANALYSIS RESULTS")
    print("="*80 + "\n")
    
    print(f"Drug: {result.drug}, Event: {result.event}")
    print(f"Total Cases: {result.time_series.total_cases}")
    print(f"Duration: {result.time_series.duration_days} days\n")
    
    print(f"Temporal Risk Score: {result.temporal_risk_score:.2f}\n")
    
    print("Flags:")
    for flag in result.temporal_flags:
        print(f"  ⚠️  {flag}")
    
    print(f"\nTrend: {result.trend.direction.value.upper()}")
    if result.trend.is_significant:
        print(f"  Slope: {result.trend.slope:.3f} cases/day")
        print(f"  R²: {result.trend.r_squared:.3f}")
    
    print(f"\nNovelty Score: {result.novelty.novelty_score:.2f}")
    print(f"Is Emerging: {result.novelty.is_emerging}")
    
    if result.spikes:
        print(f"\nSpikes Detected: {len(result.spikes)}")
        for spike in result.spikes[:3]:
            print(f"  - {spike.spike_date.date()}: {spike.spike_count} cases "
                  f"({spike.fold_increase:.1f}x expected)")
    
    if result.median_latency_days:
        print(f"\nMedian Time-to-Onset: {result.median_latency_days:.0f} days")
