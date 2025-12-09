"""
Signal Detection Core Module
Contains all statistical and Bayesian signal detection methods
"""

# Import from the provided files (matching the folder structure)
from .bayesian_signal_detection import (
    BayesianSignalDetector,
    BayesianSignal,
    ContingencyTable,
    SignalStrength
)
from .disproportionality_analysis import (
    DisproportionalityAnalyzer,
    DisproportionalityResult
)
from .causality_assessment import (
    CausalityAssessor,
    CausalityAssessment,
    ClinicalFeatures
)
from .temporal_pattern_detection import (
    TemporalPatternAnalyzer,
    TemporalPatternResult,
    TimeSeriesData
)
from .unified_signal_detection import (
    UnifiedSignalDetector,
    UnifiedSignalResult
)
from .complete_fusion_engine import (
    CompleteFusionEngine,
    CompleteFusionResult
)

__all__ = [
    'BayesianSignalDetector',
    'BayesianSignal',
    'ContingencyTable',
    'SignalStrength',
    'DisproportionalityAnalyzer',
    'DisproportionalityResult',
    'CausalityAssessor',
    'CausalityAssessment',
    'ClinicalFeatures',
    'TemporalPatternAnalyzer',
    'TemporalPatternResult',
    'TimeSeriesData',
    'UnifiedSignalDetector',
    'UnifiedSignalResult',
    'CompleteFusionEngine',
    'CompleteFusionResult',
]

