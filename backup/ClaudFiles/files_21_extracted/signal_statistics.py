"""
Statistical Signal Detection Module
Implements PRR, ROR, and IC calculations for pharmacovigilance

Based on:
- FDA Guidance on Data Mining
- WHO Programme for International Drug Monitoring
- EMA Guidelines on Signal Management
"""

import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class SignalResult:
    """Result of signal detection analysis"""
    drug: str
    event: str
    
    # Case counts from 2x2 table
    a: int  # Drug + Event
    b: int  # Drug, no Event
    c: int  # No Drug, Event
    d: int  # Neither
    
    # PRR
    prr: float
    prr_ci_lower: float
    prr_ci_upper: float
    prr_is_signal: bool
    
    # ROR
    ror: float
    ror_ci_lower: float
    ror_ci_upper: float
    ror_is_signal: bool
    
    # IC (Bayesian)
    ic: float
    ic025: float  # Lower bound of 95% credibility interval
    ic_is_signal: bool
    
    # Overall
    is_signal: bool
    signal_strength: str  # 'strong', 'moderate', 'weak', 'none'
    methods_flagged: List[str]  # Which methods flagged as signal


class SignalDetector:
    """
    Statistical signal detection for pharmacovigilance
    
    Implements three industry-standard methods:
    1. PRR (Proportional Reporting Ratio)
    2. ROR (Reporting Odds Ratio)
    3. IC (Information Component - Bayesian)
    """
    
    def __init__(
        self,
        prr_threshold: float = 2.0,
        ror_threshold: float = 1.0,
        ic_threshold: float = 0.0,
        min_cases: int = 3,
        confidence_level: float = 0.95
    ):
        """
        Initialize signal detector with thresholds
        
        Standard thresholds (FDA/WHO):
        - PRR ≥ 2.0, n ≥ 3, CI lower > 1
        - ROR > 1.0, n ≥ 3, CI lower > 1
        - IC025 > 0 (Bayesian credibility interval)
        """
        self.prr_threshold = prr_threshold
        self.ror_threshold = ror_threshold
        self.ic_threshold = ic_threshold
        self.min_cases = min_cases
        self.z_score = 1.96  # For 95% CI
        
        logger.info(f"Signal detector initialized with thresholds: "
                   f"PRR≥{prr_threshold}, ROR>{ror_threshold}, "
                   f"IC025>{ic_threshold}, n≥{min_cases}")
    
    def build_2x2_table(
        self,
        drug: str,
        event: str,
        all_cases: List[Dict]
    ) -> Tuple[int, int, int, int]:
        """
        Build 2x2 contingency table for drug-event pair
        
        Returns: (a, b, c, d) where:
            a = Cases with Drug AND Event
            b = Cases with Drug but NOT Event
            c = Cases with Event but NOT Drug
            d = Cases with neither Drug nor Event
        """
        a = 0  # Drug + Event
        b = 0  # Drug, no Event
        c = 0  # No Drug, Event
        d = 0  # Neither
        
        for case in all_cases:
            case_drug = case.get('drug_name', '').lower()
            case_event = case.get('reaction', '').lower()
            
            has_drug = drug.lower() in case_drug
            has_event = event.lower() in case_event
            
            if has_drug and has_event:
                a += 1
            elif has_drug and not has_event:
                b += 1
            elif not has_drug and has_event:
                c += 1
            else:
                d += 1
        
        logger.debug(f"2x2 table for {drug}+{event}: a={a}, b={b}, c={c}, d={d}")
        return a, b, c, d
    
    def calculate_prr(
        self,
        a: int, b: int, c: int, d: int
    ) -> Tuple[float, float, float, bool]:
        """
        Calculate Proportional Reporting Ratio (PRR)
        
        PRR = (a / (a + b)) / (c / (c + d))
        
        Signal criteria:
        - PRR ≥ threshold (default 2.0)
        - n ≥ min_cases (default 3)
        - Lower 95% CI > 1
        
        Returns: (prr, ci_lower, ci_upper, is_signal)
        """
        if a == 0 or (a + b) == 0 or (c + d) == 0:
            return 0.0, 0.0, 0.0, False
        
        # Calculate PRR
        prr = (a / (a + b)) / (c / (c + d))
        
        # Calculate standard error
        # SE = sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
        try:
            se = math.sqrt(
                1/a - 1/(a+b) + 1/c - 1/(c+d)
            )
            
            # 95% Confidence Interval
            log_prr = math.log(prr)
            ci_lower = math.exp(log_prr - self.z_score * se)
            ci_upper = math.exp(log_prr + self.z_score * se)
            
        except (ValueError, ZeroDivisionError):
            ci_lower = 0.0
            ci_upper = float('inf')
        
        # Check signal criteria
        is_signal = (
            prr >= self.prr_threshold and
            a >= self.min_cases and
            ci_lower > 1.0
        )
        
        logger.debug(f"PRR: {prr:.2f} (CI: {ci_lower:.2f}-{ci_upper:.2f}), "
                    f"Signal: {is_signal}")
        
        return prr, ci_lower, ci_upper, is_signal
    
    def calculate_ror(
        self,
        a: int, b: int, c: int, d: int
    ) -> Tuple[float, float, float, bool]:
        """
        Calculate Reporting Odds Ratio (ROR)
        
        ROR = (a × d) / (b × c)
        
        Signal criteria:
        - ROR > threshold (default 1.0)
        - n ≥ min_cases (default 3)
        - Lower 95% CI > 1
        
        Returns: (ror, ci_lower, ci_upper, is_signal)
        """
        if a == 0 or b == 0 or c == 0 or d == 0:
            return 0.0, 0.0, 0.0, False
        
        # Calculate ROR
        ror = (a * d) / (b * c)
        
        # Calculate standard error
        # SE = sqrt(1/a + 1/b + 1/c + 1/d)
        try:
            se = math.sqrt(1/a + 1/b + 1/c + 1/d)
            
            # 95% Confidence Interval
            log_ror = math.log(ror)
            ci_lower = math.exp(log_ror - self.z_score * se)
            ci_upper = math.exp(log_ror + self.z_score * se)
            
        except (ValueError, ZeroDivisionError):
            ci_lower = 0.0
            ci_upper = float('inf')
        
        # Check signal criteria
        is_signal = (
            ror > self.ror_threshold and
            a >= self.min_cases and
            ci_lower > 1.0
        )
        
        logger.debug(f"ROR: {ror:.2f} (CI: {ci_lower:.2f}-{ci_upper:.2f}), "
                    f"Signal: {is_signal}")
        
        return ror, ci_lower, ci_upper, is_signal
    
    def calculate_ic(
        self,
        a: int, b: int, c: int, d: int
    ) -> Tuple[float, float, bool]:
        """
        Calculate Information Component (IC) - Bayesian method
        
        Used by WHO VigiBase
        
        IC = log₂(observed / expected)
        Expected = ((a+b) × (a+c)) / N
        
        Signal criteria:
        - IC025 > threshold (default 0)
        
        Returns: (ic, ic025, is_signal)
        """
        N = a + b + c + d
        
        if a == 0 or N == 0:
            return 0.0, 0.0, False
        
        # Calculate expected value (if independent)
        expected = ((a + b) * (a + c)) / N
        
        if expected == 0:
            return 0.0, 0.0, False
        
        # Calculate IC
        ic = math.log2(a / expected)
        
        # Calculate IC025 (lower bound of 95% credibility interval)
        # Simplified Bayesian calculation
        try:
            ic025 = ic - self.z_score * math.sqrt(1/a)
        except (ValueError, ZeroDivisionError):
            ic025 = 0.0
        
        # Check signal criteria
        is_signal = ic025 > self.ic_threshold
        
        logger.debug(f"IC: {ic:.2f} (IC025: {ic025:.2f}), Signal: {is_signal}")
        
        return ic, ic025, is_signal
    
    def detect_signal(
        self,
        drug: str,
        event: str,
        all_cases: List[Dict]
    ) -> SignalResult:
        """
        Run complete signal detection analysis
        
        Calculates PRR, ROR, and IC for drug-event pair
        Returns comprehensive signal analysis result
        """
        # Build 2x2 contingency table
        a, b, c, d = self.build_2x2_table(drug, event, all_cases)
        
        # Calculate PRR
        prr, prr_ci_lower, prr_ci_upper, prr_is_signal = self.calculate_prr(a, b, c, d)
        
        # Calculate ROR
        ror, ror_ci_lower, ror_ci_upper, ror_is_signal = self.calculate_ror(a, b, c, d)
        
        # Calculate IC
        ic, ic025, ic_is_signal = self.calculate_ic(a, b, c, d)
        
        # Determine overall signal status
        methods_flagged = []
        if prr_is_signal:
            methods_flagged.append('PRR')
        if ror_is_signal:
            methods_flagged.append('ROR')
        if ic_is_signal:
            methods_flagged.append('IC')
        
        is_signal = len(methods_flagged) > 0
        
        # Determine signal strength
        if len(methods_flagged) == 3:
            signal_strength = 'strong'  # All methods agree
        elif len(methods_flagged) == 2:
            signal_strength = 'moderate'  # Two methods agree
        elif len(methods_flagged) == 1:
            signal_strength = 'weak'  # Only one method flags
        else:
            signal_strength = 'none'  # No signal
        
        result = SignalResult(
            drug=drug,
            event=event,
            a=a, b=b, c=c, d=d,
            prr=prr,
            prr_ci_lower=prr_ci_lower,
            prr_ci_upper=prr_ci_upper,
            prr_is_signal=prr_is_signal,
            ror=ror,
            ror_ci_lower=ror_ci_lower,
            ror_ci_upper=ror_ci_upper,
            ror_is_signal=ror_is_signal,
            ic=ic,
            ic025=ic025,
            ic_is_signal=ic_is_signal,
            is_signal=is_signal,
            signal_strength=signal_strength,
            methods_flagged=methods_flagged
        )
        
        logger.info(f"Signal detection for {drug}+{event}: "
                   f"{'SIGNAL' if is_signal else 'NO SIGNAL'} "
                   f"({signal_strength}, {', '.join(methods_flagged)})")
        
        return result
    
    def detect_all_signals(
        self,
        all_cases: List[Dict],
        min_case_count: int = 1
    ) -> List[SignalResult]:
        """
        Detect signals for all drug-event combinations
        
        Args:
            all_cases: List of all case dictionaries
            min_case_count: Only analyze pairs with at least this many cases
        
        Returns:
            List of SignalResult objects for all combinations
        """
        # Get all unique drug-event pairs
        pairs = {}
        for case in all_cases:
            drug = case.get('drug_name', 'Unknown')
            event = case.get('reaction', 'Unknown')
            key = (drug, event)
            pairs[key] = pairs.get(key, 0) + 1
        
        # Filter by minimum case count
        pairs = {k: v for k, v in pairs.items() if v >= min_case_count}
        
        logger.info(f"Analyzing {len(pairs)} drug-event pairs "
                   f"(min {min_case_count} cases)")
        
        # Detect signals for each pair
        results = []
        for (drug, event), count in pairs.items():
            result = self.detect_signal(drug, event, all_cases)
            results.append(result)
        
        # Sort by signal strength then case count
        strength_order = {'strong': 0, 'moderate': 1, 'weak': 2, 'none': 3}
        results.sort(
            key=lambda r: (strength_order[r.signal_strength], -r.a)
        )
        
        signals_found = sum(1 for r in results if r.is_signal)
        logger.info(f"Signal detection complete: {signals_found}/{len(results)} "
                   f"drug-event pairs flagged as signals")
        
        return results


# Convenience functions for API use

def calculate_signal_statistics(
    drug: str,
    event: str,
    all_cases: List[Dict],
    thresholds: Optional[Dict] = None
) -> Dict:
    """
    Calculate signal statistics for a drug-event pair
    
    Returns dict with PRR, ROR, IC and signal status
    """
    detector = SignalDetector(**(thresholds or {}))
    result = detector.detect_signal(drug, event, all_cases)
    
    return {
        'drug': result.drug,
        'event': result.event,
        'case_count': result.a,
        'prr': {
            'value': round(result.prr, 2),
            'ci_lower': round(result.prr_ci_lower, 2),
            'ci_upper': round(result.prr_ci_upper, 2),
            'is_signal': result.prr_is_signal
        },
        'ror': {
            'value': round(result.ror, 2),
            'ci_lower': round(result.ror_ci_lower, 2),
            'ci_upper': round(result.ror_ci_upper, 2),
            'is_signal': result.ror_is_signal
        },
        'ic': {
            'value': round(result.ic, 2),
            'ic025': round(result.ic025, 2),
            'is_signal': result.ic_is_signal
        },
        'overall': {
            'is_signal': result.is_signal,
            'signal_strength': result.signal_strength,
            'methods_flagged': result.methods_flagged
        }
    }


def get_all_signals(
    all_cases: List[Dict],
    signals_only: bool = False,
    min_cases: int = 3
) -> List[Dict]:
    """
    Get all signals from case data
    
    Args:
        all_cases: List of case dictionaries
        signals_only: If True, return only flagged signals
        min_cases: Minimum case count to analyze
    
    Returns:
        List of signal statistic dictionaries
    """
    detector = SignalDetector()
    results = detector.detect_all_signals(all_cases, min_case_count=min_cases)
    
    if signals_only:
        results = [r for r in results if r.is_signal]
    
    return [
        {
            'drug': r.drug,
            'event': r.event,
            'case_count': r.a,
            'prr': round(r.prr, 2),
            'prr_ci': f"[{r.prr_ci_lower:.2f}-{r.prr_ci_upper:.2f}]",
            'ror': round(r.ror, 2),
            'ror_ci': f"[{r.ror_ci_lower:.2f}-{r.ror_ci_upper:.2f}]",
            'ic': round(r.ic, 2),
            'ic025': round(r.ic025, 2),
            'is_signal': r.is_signal,
            'signal_strength': r.signal_strength,
            'methods': ', '.join(r.methods_flagged) if r.methods_flagged else 'None'
        }
        for r in results
    ]
