"""
Enhanced Disproportionality Analysis Module
============================================

Implements classical and enhanced disproportionality measures:
- Proportional Reporting Ratio (PRR)
- Reporting Odds Ratio (ROR)
- Information Component (IC)
- Chi-square test
- Fisher's Exact Test (for small samples)

Enhanced with confidence intervals and significance testing.

Author: AetherSignal Team
Date: 2024-12-08
Version: 1.0.0
"""

import numpy as np
from scipy import stats
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

from .bayesian_signal_detection import ContingencyTable, SignalStrength


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class DisproportionalityResult:
    """Complete disproportionality analysis result"""
    drug: str
    event: str
    
    # Observed data
    observed_count: int
    expected_count: float
    
    # PRR (Proportional Reporting Ratio)
    prr: float
    prr_lower_ci: float
    prr_upper_ci: float
    prr_is_signal: bool
    
    # ROR (Reporting Odds Ratio)
    ror: float
    ror_lower_ci: float
    ror_upper_ci: float
    ror_is_signal: bool
    
    # IC (Information Component)
    ic: float
    ic_lower_ci: float
    ic_upper_ci: float
    ic_is_signal: bool
    
    # Statistical tests
    chi_square: float
    chi_square_p_value: float
    fishers_p_value: Optional[float]
    
    # Overall assessment
    is_signal: bool
    signal_strength: SignalStrength
    confidence_level: float
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            "drug": self.drug,
            "event": self.event,
            "observed_count": self.observed_count,
            "expected_count": round(self.expected_count, 2),
            "prr": {
                "value": round(self.prr, 3),
                "lower_ci": round(self.prr_lower_ci, 3),
                "upper_ci": round(self.prr_upper_ci, 3),
                "is_signal": self.prr_is_signal
            },
            "ror": {
                "value": round(self.ror, 3),
                "lower_ci": round(self.ror_lower_ci, 3),
                "upper_ci": round(self.ror_upper_ci, 3),
                "is_signal": self.ror_is_signal
            },
            "ic": {
                "value": round(self.ic, 3),
                "lower_ci": round(self.ic_lower_ci, 3),
                "upper_ci": round(self.ic_upper_ci, 3),
                "is_signal": self.ic_is_signal
            },
            "statistical_tests": {
                "chi_square": round(self.chi_square, 3),
                "chi_square_p_value": self.chi_square_p_value,
                "fishers_p_value": self.fishers_p_value
            },
            "overall": {
                "is_signal": self.is_signal,
                "strength": self.signal_strength.value,
                "confidence": round(self.confidence_level, 3)
            }
        }


# ============================================================================
# PRR (PROPORTIONAL REPORTING RATIO)
# ============================================================================

class PRRCalculator:
    """
    Proportional Reporting Ratio (PRR)
    
    PRR compares the proportion of reports for a specific drug-event pair
    to the proportion in the rest of the database.
    
    Formula:
        PRR = [a/(a+b)] / [c/(c+d)]
        
    where:
        a = drug + event
        b = drug + not event
        c = not drug + event
        d = not drug + not event
    
    Signal criteria (UK MHRA):
        - PRR ≥ 2.0
        - Chi-square ≥ 4
        - Count ≥ 3
    """
    
    @staticmethod
    def calculate(ct: ContingencyTable) -> Tuple[float, float, float, bool]:
        """
        Calculate PRR with 95% confidence interval.
        
        Args:
            ct: Contingency table
            
        Returns:
            (prr, lower_ci, upper_ci, is_signal)
        """
        a, b, c, d = ct.n11, ct.n10, ct.n01, ct.n00
        
        # Avoid division by zero
        if c == 0 or (a + b) == 0 or (c + d) == 0:
            return 0.0, 0.0, 0.0, False
        
        # Calculate PRR
        prop_drug = a / (a + b)
        prop_no_drug = c / (c + d)
        prr = prop_drug / prop_no_drug if prop_no_drug > 0 else 0.0
        
        # Calculate 95% CI using log transformation
        # SE(log PRR) ≈ sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
        if a > 0:
            se_log_prr = np.sqrt(
                1/a - 1/(a+b) + 1/c - 1/(c+d)
            )
            
            log_prr = np.log(prr) if prr > 0 else 0
            margin = 1.96 * se_log_prr
            
            lower_ci = np.exp(log_prr - margin)
            upper_ci = np.exp(log_prr + margin)
        else:
            lower_ci = 0.0
            upper_ci = 0.0
        
        # Signal detection (UK MHRA criteria)
        is_signal = prr >= 2.0 and a >= 3
        
        return prr, lower_ci, upper_ci, is_signal


# ============================================================================
# ROR (REPORTING ODDS RATIO)
# ============================================================================

class RORCalculator:
    """
    Reporting Odds Ratio (ROR)
    
    ROR is the odds of reporting the event for the drug of interest
    compared to all other drugs.
    
    Formula:
        ROR = (a/b) / (c/d) = (a*d) / (b*c)
        
    Signal criteria (Netherlands PhV Centre):
        - Lower 95% CI > 1.0
        - Count ≥ 3
    """
    
    @staticmethod
    def calculate(ct: ContingencyTable) -> Tuple[float, float, float, bool]:
        """
        Calculate ROR with 95% confidence interval.
        
        Args:
            ct: Contingency table
            
        Returns:
            (ror, lower_ci, upper_ci, is_signal)
        """
        a, b, c, d = ct.n11, ct.n10, ct.n01, ct.n00
        
        # Avoid division by zero (add 0.5 continuity correction)
        if b == 0 or c == 0:
            a, b, c, d = a + 0.5, b + 0.5, c + 0.5, d + 0.5
        
        # Calculate ROR
        ror = (a * d) / (b * c)
        
        # Calculate 95% CI using log transformation
        # SE(log ROR) ≈ sqrt(1/a + 1/b + 1/c + 1/d)
        se_log_ror = np.sqrt(1/a + 1/b + 1/c + 1/d)
        
        log_ror = np.log(ror)
        margin = 1.96 * se_log_ror
        
        lower_ci = np.exp(log_ror - margin)
        upper_ci = np.exp(log_ror + margin)
        
        # Signal detection (Netherlands criteria)
        is_signal = lower_ci > 1.0 and ct.n11 >= 3
        
        return ror, lower_ci, upper_ci, is_signal


# ============================================================================
# IC (INFORMATION COMPONENT)
# ============================================================================

class ICCalculator:
    """
    Information Component (IC)
    
    IC is a Bayesian measure used by WHO Uppsala Monitoring Centre.
    It measures the degree of disproportionality using information theory.
    
    Formula:
        IC = log2[P(drug, event) / (P(drug) * P(event))]
        
    Simplified:
        IC = log2[(n11 * N) / (n1. * n.1)]
        
    Signal criterion (WHO UMC):
        - IC_025 (lower 95% CI) > 0
    """
    
    @staticmethod
    def calculate(ct: ContingencyTable) -> Tuple[float, float, float, bool]:
        """
        Calculate IC with 95% credibility interval.
        
        Args:
            ct: Contingency table
            
        Returns:
            (ic, lower_ci, upper_ci, is_signal)
        """
        a = ct.n11
        n1x = ct.n1x
        nx1 = ct.nx1
        N = ct.nxx
        
        if a == 0 or n1x == 0 or nx1 == 0 or N == 0:
            return 0.0, 0.0, 0.0, False
        
        # Expected count
        E = (n1x * nx1) / N
        
        # IC point estimate
        ic = np.log2(a / E) if E > 0 else 0.0
        
        # Credibility interval (WHO UMC method)
        # Uses a Bayesian approach with prior
        # IC_025 = IC - 2*sqrt(1/a + 1/E)
        # IC_975 = IC + 2*sqrt(1/a + 1/E)
        
        sd = np.sqrt(1/a + 1/E) if E > 0 else 0
        lower_ci = ic - 1.96 * sd
        upper_ci = ic + 1.96 * sd
        
        # Signal detection (WHO criteria)
        is_signal = lower_ci > 0 and a >= 3
        
        return ic, lower_ci, upper_ci, is_signal


# ============================================================================
# STATISTICAL TESTS
# ============================================================================

class StatisticalTests:
    """Chi-square and Fisher's Exact Test"""
    
    @staticmethod
    def chi_square(ct: ContingencyTable) -> Tuple[float, float]:
        """
        Calculate chi-square statistic and p-value.
        
        Args:
            ct: Contingency table
            
        Returns:
            (chi_square, p_value)
        """
        # Create 2x2 array
        observed = np.array([
            [ct.n11, ct.n10],
            [ct.n01, ct.n00]
        ])
        
        # Calculate chi-square
        chi2, p_value, dof, expected = stats.chi2_contingency(observed)
        
        return chi2, p_value
    
    @staticmethod
    def fishers_exact(ct: ContingencyTable) -> float:
        """
        Calculate Fisher's Exact Test p-value.
        
        Used when expected counts are small (< 5).
        
        Args:
            ct: Contingency table
            
        Returns:
            p_value (two-tailed)
        """
        # Create 2x2 array
        table = np.array([
            [ct.n11, ct.n10],
            [ct.n01, ct.n00]
        ])
        
        # Fisher's exact test
        odds_ratio, p_value = stats.fisher_exact(table)
        
        return p_value


# ============================================================================
# SIGNAL STRENGTH ASSESSMENT
# ============================================================================

class DisproportionalitySignalClassifier:
    """Classify overall signal strength from multiple metrics"""
    
    @staticmethod
    def classify(
        prr: float,
        prr_is_signal: bool,
        ror: float,
        ror_is_signal: bool,
        ic_lower: float,
        ic_is_signal: bool,
        observed: int,
        chi_square_p: float
    ) -> Tuple[SignalStrength, float]:
        """
        Classify signal strength based on multiple criteria.
        
        Classification logic:
        - Very Strong: All 3 methods detect signal + count ≥ 10 + p < 0.001
        - Strong: 2+ methods detect signal + count ≥ 5 + p < 0.01
        - Moderate: 1+ method detects signal + count ≥ 3 + p < 0.05
        - Weak: Borderline signal
        - None: No signal
        
        Args:
            prr: PRR value
            prr_is_signal: PRR signal detection
            ror: ROR value
            ror_is_signal: ROR signal detection
            ic_lower: IC lower CI
            ic_is_signal: IC signal detection
            observed: Observed count
            chi_square_p: Chi-square p-value
            
        Returns:
            (strength, confidence)
        """
        # Count how many methods detect signal
        methods_detecting = sum([prr_is_signal, ror_is_signal, ic_is_signal])
        
        # Very Strong Signal
        if methods_detecting == 3 and observed >= 10 and chi_square_p < 0.001:
            return SignalStrength.VERY_STRONG, 0.95
        
        # Strong Signal
        if methods_detecting >= 2 and observed >= 5 and chi_square_p < 0.01:
            return SignalStrength.STRONG, 0.85
        
        # Moderate Signal
        if methods_detecting >= 1 and observed >= 3 and chi_square_p < 0.05:
            return SignalStrength.MODERATE, 0.70
        
        # Weak Signal
        if methods_detecting >= 1 or (prr >= 1.5 and observed >= 3):
            return SignalStrength.WEAK, 0.50
        
        # No Signal
        return SignalStrength.NONE, 0.25


# ============================================================================
# MAIN DISPROPORTIONALITY ANALYZER
# ============================================================================

class DisproportionalityAnalyzer:
    """
    Complete disproportionality analysis system.
    
    Combines PRR, ROR, IC, and statistical tests into a unified interface.
    """
    
    def __init__(self, min_count: int = 3):
        """
        Args:
            min_count: Minimum observed count to consider
        """
        self.min_count = min_count
        self.prr_calculator = PRRCalculator()
        self.ror_calculator = RORCalculator()
        self.ic_calculator = ICCalculator()
        self.statistical_tests = StatisticalTests()
        self.classifier = DisproportionalitySignalClassifier()
    
    def analyze(
        self,
        drug: str,
        event: str,
        contingency_table: ContingencyTable
    ) -> DisproportionalityResult:
        """
        Perform complete disproportionality analysis.
        
        Args:
            drug: Drug name
            event: Event/reaction name
            contingency_table: 2x2 contingency table
            
        Returns:
            Complete disproportionality result
        """
        observed = contingency_table.n11
        expected = contingency_table.expected
        
        # Skip if below minimum count
        if observed < self.min_count:
            return self._create_no_signal(drug, event, observed, expected)
        
        # Calculate PRR
        prr, prr_lower, prr_upper, prr_signal = self.prr_calculator.calculate(
            contingency_table
        )
        
        # Calculate ROR
        ror, ror_lower, ror_upper, ror_signal = self.ror_calculator.calculate(
            contingency_table
        )
        
        # Calculate IC
        ic, ic_lower, ic_upper, ic_signal = self.ic_calculator.calculate(
            contingency_table
        )
        
        # Statistical tests
        chi_square, chi_p = self.statistical_tests.chi_square(contingency_table)
        
        # Fisher's exact for small samples
        fishers_p = None
        if expected < 5 or observed < 5:
            fishers_p = self.statistical_tests.fishers_exact(contingency_table)
        
        # Overall signal assessment
        is_signal = prr_signal or ror_signal or ic_signal
        
        # Classify signal strength
        strength, confidence = self.classifier.classify(
            prr, prr_signal,
            ror, ror_signal,
            ic_lower, ic_signal,
            observed, chi_p
        )
        
        return DisproportionalityResult(
            drug=drug,
            event=event,
            observed_count=observed,
            expected_count=expected,
            prr=prr,
            prr_lower_ci=prr_lower,
            prr_upper_ci=prr_upper,
            prr_is_signal=prr_signal,
            ror=ror,
            ror_lower_ci=ror_lower,
            ror_upper_ci=ror_upper,
            ror_is_signal=ror_signal,
            ic=ic,
            ic_lower_ci=ic_lower,
            ic_upper_ci=ic_upper,
            ic_is_signal=ic_signal,
            chi_square=chi_square,
            chi_square_p_value=chi_p,
            fishers_p_value=fishers_p,
            is_signal=is_signal,
            signal_strength=strength,
            confidence_level=confidence
        )
    
    def _create_no_signal(
        self,
        drug: str,
        event: str,
        observed: int,
        expected: float
    ) -> DisproportionalityResult:
        """Create a 'no signal' result for low-count pairs"""
        return DisproportionalityResult(
            drug=drug,
            event=event,
            observed_count=observed,
            expected_count=expected,
            prr=0.0,
            prr_lower_ci=0.0,
            prr_upper_ci=0.0,
            prr_is_signal=False,
            ror=0.0,
            ror_lower_ci=0.0,
            ror_upper_ci=0.0,
            ror_is_signal=False,
            ic=0.0,
            ic_lower_ci=0.0,
            ic_upper_ci=0.0,
            ic_is_signal=False,
            chi_square=0.0,
            chi_square_p_value=1.0,
            fishers_p_value=None,
            is_signal=False,
            signal_strength=SignalStrength.NONE,
            confidence_level=0.0
        )


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example analysis
    
    # Create contingency table
    # Example: Aspirin + Bleeding
    ct = ContingencyTable(n11=45, n10=955, n01=120, n00=9880)
    
    # Create analyzer
    analyzer = DisproportionalityAnalyzer(min_count=3)
    
    # Perform analysis
    result = analyzer.analyze("Aspirin", "Bleeding", ct)
    
    # Print results
    print("\n" + "="*80)
    print("DISPROPORTIONALITY ANALYSIS RESULTS")
    print("="*80 + "\n")
    
    print(f"Drug: {result.drug}, Event: {result.event}")
    print(f"Observed: {result.observed_count}, Expected: {result.expected_count:.1f}")
    print()
    print(f"PRR: {result.prr:.2f} (95% CI: {result.prr_lower_ci:.2f}-{result.prr_upper_ci:.2f})")
    print(f"  Signal: {result.prr_is_signal}")
    print()
    print(f"ROR: {result.ror:.2f} (95% CI: {result.ror_lower_ci:.2f}-{result.ror_upper_ci:.2f})")
    print(f"  Signal: {result.ror_is_signal}")
    print()
    print(f"IC: {result.ic:.2f} (95% CI: {result.ic_lower_ci:.2f}-{result.ic_upper_ci:.2f})")
    print(f"  Signal: {result.ic_is_signal}")
    print()
    print(f"Chi-square: {result.chi_square:.2f}, p-value: {result.chi_square_p_value:.4f}")
    if result.fishers_p_value:
        print(f"Fisher's exact p-value: {result.fishers_p_value:.4f}")
    print()
    print(f"Overall Signal: {result.is_signal}")
    print(f"Signal Strength: {result.signal_strength.value}")
    print(f"Confidence: {result.confidence_level:.2f}")
