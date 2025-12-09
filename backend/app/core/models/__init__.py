"""
Data Models for Signal Detection
"""

from dataclasses import dataclass
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class SignalStrength(Enum):
    """Signal strength classification"""
    NONE = "none"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERY_STRONG = "very_strong"


class CausalityCategory(Enum):
    """WHO-UMC causality categories"""
    CERTAIN = "CERTAIN"
    PROBABLE = "PROBABLE"
    POSSIBLE = "POSSIBLE"
    UNLIKELY = "UNLIKELY"
    CONDITIONAL = "CONDITIONAL"
    UNASSESSABLE = "UNASSESSABLE"


@dataclass
class ContingencyTable:
    """2x2 contingency table for drug-event analysis"""
    n11: int  # Drug + Event
    n10: int  # Drug, no Event
    n01: int  # No Drug, Event
    n00: int  # Neither
    
    @property
    def total(self) -> int:
        return self.n11 + self.n10 + self.n01 + self.n00
    
    @property
    def drug_total(self) -> int:
        return self.n11 + self.n10
    
    @property
    def event_total(self) -> int:
        return self.n11 + self.n01

