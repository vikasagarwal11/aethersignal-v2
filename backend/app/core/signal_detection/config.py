"""
Signal Detection Configuration System
====================================

Hierarchical configuration system for signal detection thresholds and weights:
- Platform (defaults) → Admin (overrides) → Organization (overrides) → User (overrides)

All thresholds, weights, and scoring parameters are configurable at each level.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, Any
import json
import os
from pathlib import Path


# ============================================================================
# Default Platform Configuration
# ============================================================================

@dataclass
class SignalDetectionConfig:
    """Configuration for signal detection thresholds and weights."""
    
    # Layer 1: Single-Source Quantum Weights
    layer1_weights: Dict[str, float] = field(default_factory=lambda: {
        "rarity": 0.40,
        "seriousness": 0.35,
        "recency": 0.20,
        "count": 0.05,
    })
    
    # Layer 1: Interaction Thresholds
    interaction_thresholds: Dict[str, float] = field(default_factory=lambda: {
        "rare_serious": 0.7,      # Threshold for rare+serious interaction
        "rare_recent": 0.7,        # Threshold for rare+recent interaction
        "serious_recent": 0.7,     # Threshold for serious+recent interaction
        "all_three": 0.6,          # Threshold for all three interaction (more lenient)
    })
    
    # Layer 1: Interaction Boosts
    interaction_boosts: Dict[str, float] = field(default_factory=lambda: {
        "rare_serious": 0.15,
        "rare_recent": 0.10,
        "serious_recent": 0.10,
        "all_three": 0.20,
    })
    
    # Layer 1: Tunneling Boost Range
    tunneling_range: Dict[str, float] = field(default_factory=lambda: {
        "min": 0.5,
        "max": 0.7,
        "boost_per_component": 0.05,
    })
    
    # Layer 2: Multi-Source Quantum Weights
    layer2_weights: Dict[str, float] = field(default_factory=lambda: {
        "frequency": 0.25,
        "severity": 0.20,
        "burst": 0.15,
        "novelty": 0.15,
        "consensus": 0.15,
        "mechanism": 0.10,
    })
    
    # Layer 2: Source Priorities (for weighted consensus)
    source_priorities: Dict[str, float] = field(default_factory=lambda: {
        "faers": 0.40,
        "rwe": 0.25,
        "clinicaltrials": 0.15,
        "pubmed": 0.10,
        "social": 0.07,
        "label": 0.03,
    })
    
    # Layer 2: Frequency Thresholds
    frequency_thresholds: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "100": {"score": 1.0},
        "50": {"score": 0.8},
        "20": {"score": 0.6},
        "10": {"score": 0.4},
        "5": {"score": 0.3},
        "3": {"score": 0.2},
        "1": {"score": 0.1},
    })
    
    # Layer 2: Consensus Boost
    consensus_boost: Dict[str, Any] = field(default_factory=lambda: {
        "high_conf_threshold": 0.7,      # Minimum confidence for "high confidence"
        "high_conf_strength_threshold": 0.7,  # Minimum strength for "high confidence"
        "min_high_conf_sources": 3,       # Minimum number of high-conf sources for boost
        "boost_amount": 0.2,             # Boost amount when threshold met
    })
    
    # Fusion Weights
    fusion_weights: Dict[str, float] = field(default_factory=lambda: {
        "bayesian": 0.35,
        "quantum_layer1": 0.40,
        "quantum_layer2": 0.25,
    })
    
    # Alert Level Thresholds
    alert_levels: Dict[str, float] = field(default_factory=lambda: {
        "critical": 0.95,
        "high": 0.80,
        "moderate": 0.65,
        "watchlist": 0.45,
        "low": 0.25,
    })
    
    # Seriousness Scoring Weights
    seriousness_weights: Dict[str, float] = field(default_factory=lambda: {
        "flag_base": 0.5,              # Base score for seriousness flag
        "death": 0.5,                  # Death outcome boost
        "hospitalization": 0.3,        # Hospitalization boost
        "disability": 0.2,             # Disability boost
        "serious_fraction": 0.3,       # Weight for serious_count / total_count
    })
    
    # Recency Scoring
    recency_config: Dict[str, Any] = field(default_factory=lambda: {
        "recent_days": 365,            # Days considered "recent"
        "moderate_days": 730,          # Days considered "moderate"
        "recent_weight": 1.0,          # Weight for recent cases
        "moderate_weight": 0.5,        # Weight for moderate cases
        "old_weight": 0.2,             # Weight for old cases
    })
    
    # Novelty Scoring
    novelty_config: Dict[str, Any] = field(default_factory=lambda: {
        "very_recent_days": 30,        # Very recent (off-label)
        "recent_days": 90,             # Recent (off-label)
        "moderate_days": 180,           # Moderate (off-label)
        "old_days": 365,               # Old (off-label)
        "on_label_recent_days": 30,    # Recent (on-label)
        "on_label_moderate_days": 90,  # Moderate (on-label)
    })
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            "layer1_weights": self.layer1_weights,
            "interaction_thresholds": self.interaction_thresholds,
            "interaction_boosts": self.interaction_boosts,
            "tunneling_range": self.tunneling_range,
            "layer2_weights": self.layer2_weights,
            "source_priorities": self.source_priorities,
            "frequency_thresholds": self.frequency_thresholds,
            "consensus_boost": self.consensus_boost,
            "fusion_weights": self.fusion_weights,
            "alert_levels": self.alert_levels,
            "seriousness_weights": self.seriousness_weights,
            "recency_config": self.recency_config,
            "novelty_config": self.novelty_config,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SignalDetectionConfig":
        """Create config from dictionary."""
        config = cls()
        for key, value in data.items():
            if hasattr(config, key):
                setattr(config, key, value)
        return config
    
    def merge(self, other: "SignalDetectionConfig") -> "SignalDetectionConfig":
        """Merge another config into this one (other overrides this)."""
        merged = SignalDetectionConfig()
        
        # Deep merge dictionaries
        for key in merged.__dataclass_fields__:
            this_value = getattr(self, key)
            other_value = getattr(other, key)
            
            if isinstance(this_value, dict) and isinstance(other_value, dict):
                merged_value = {**this_value, **other_value}
            else:
                merged_value = other_value if other_value is not None else this_value
            
            setattr(merged, key, merged_value)
        
        return merged


# ============================================================================
# Configuration Manager
# ============================================================================

class ConfigManager:
    """Manages hierarchical configuration loading and merging."""
    
    def __init__(self):
        self.platform_config = SignalDetectionConfig()  # Default platform config
        self.config_cache: Dict[str, SignalDetectionConfig] = {}
    
    def get_config(
        self,
        user_id: Optional[str] = None,
        organization: Optional[str] = None,
        admin_overrides: Optional[Dict[str, Any]] = None,
    ) -> SignalDetectionConfig:
        """
        Get merged configuration for a user/organization.
        
        Hierarchy: Platform → Admin → Organization → User
        
        Args:
            user_id: User ID (for user-level overrides)
            organization: Organization name (for org-level overrides)
            admin_overrides: Admin-level overrides (from database/config file)
        
        Returns:
            Merged SignalDetectionConfig
        """
        config = self.platform_config
        
        # Load admin overrides (if provided)
        if admin_overrides:
            admin_config = SignalDetectionConfig.from_dict(admin_overrides)
            config = config.merge(admin_config)
        
        # TODO: Load organization overrides from database
        # if organization:
        #     org_config = self._load_org_config(organization)
        #     config = config.merge(org_config)
        
        # TODO: Load user overrides from database
        # if user_id:
        #     user_config = self._load_user_config(user_id)
        #     config = config.merge(user_config)
        
        return config
    
    def _load_org_config(self, organization: str) -> Optional[SignalDetectionConfig]:
        """Load organization-level configuration from database."""
        # TODO: Implement database lookup
        # Example:
        # result = supabase.table("signal_detection_config")
        #     .select("*")
        #     .eq("organization", organization)
        #     .eq("level", "organization")
        #     .execute()
        # if result.data:
        #     return SignalDetectionConfig.from_dict(result.data[0]["config"])
        return None
    
    def _load_user_config(self, user_id: str) -> Optional[SignalDetectionConfig]:
        """Load user-level configuration from database."""
        # TODO: Implement database lookup
        return None
    
    def save_platform_config(self, config: SignalDetectionConfig, path: Optional[str] = None):
        """Save platform configuration to file."""
        if path is None:
            path = os.getenv("SIGNAL_CONFIG_PATH", "config/signal_detection_config.json")
        
        config_path = Path(path)
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, "w") as f:
            json.dump(config.to_dict(), f, indent=2)
    
    def load_platform_config(self, path: Optional[str] = None) -> SignalDetectionConfig:
        """Load platform configuration from file."""
        if path is None:
            path = os.getenv("SIGNAL_CONFIG_PATH", "config/signal_detection_config.json")
        
        config_path = Path(path)
        if config_path.exists():
            with open(config_path, "r") as f:
                data = json.load(f)
                return SignalDetectionConfig.from_dict(data)
        
        return SignalDetectionConfig()  # Return defaults if file doesn't exist


# Global config manager instance
config_manager = ConfigManager()

