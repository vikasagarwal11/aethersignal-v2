-- Database Migration: Signal Detection Configuration
-- Version: 010_signal_detection_config
-- Date: 2024-12-09
-- Purpose: Store hierarchical configuration for signal detection thresholds and weights

-- ============================================================================
-- Signal Detection Configuration Table
-- ============================================================================
-- Stores configuration overrides at platform, organization, and user levels
-- Hierarchy: Platform (defaults) → Organization (overrides) → User (overrides)

CREATE TABLE IF NOT EXISTS signal_detection_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration scope
    level TEXT NOT NULL CHECK (level IN ('platform', 'organization', 'user')),
    organization TEXT,  -- NULL for platform/user level, set for org level
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for platform/org level, set for user level
    
    -- Configuration data (JSONB for flexibility)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),  -- Who created/updated this config
    notes TEXT,  -- Optional notes about why this config was set
    
    -- Constraints (CHECK constraints only - unique constraints use partial indexes below)
    CONSTRAINT org_level_requires_org CHECK (
        (level = 'organization' AND organization IS NOT NULL) OR
        (level != 'organization')
    ),
    CONSTRAINT user_level_requires_user CHECK (
        (level = 'user' AND user_id IS NOT NULL) OR
        (level != 'user')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_config_level ON signal_detection_config(level);
CREATE INDEX IF NOT EXISTS idx_signal_config_organization ON signal_detection_config(organization) WHERE organization IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signal_config_user_id ON signal_detection_config(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signal_config_org_level ON signal_detection_config(level, organization) WHERE organization IS NOT NULL;

-- Partial unique indexes (for uniqueness constraints with WHERE clause)
CREATE UNIQUE INDEX IF NOT EXISTS unique_platform_config 
    ON signal_detection_config(level) 
    WHERE level = 'platform';

CREATE UNIQUE INDEX IF NOT EXISTS unique_org_config 
    ON signal_detection_config(level, organization) 
    WHERE level = 'organization';

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_config 
    ON signal_detection_config(level, user_id) 
    WHERE level = 'user';

-- Enable Row Level Security
ALTER TABLE signal_detection_config ENABLE ROW LEVEL SECURITY;

-- Policy: Platform config visible to all authenticated users (read-only for non-admins)
CREATE POLICY "Platform config readable by all"
    ON signal_detection_config FOR SELECT
    USING (level = 'platform');

-- Policy: Organization config visible to users in that organization
CREATE POLICY "Org config readable by org members"
    ON signal_detection_config FOR SELECT
    USING (
        level = 'organization' AND
        organization = (
            SELECT organization FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: User config visible only to that user
CREATE POLICY "User config readable by owner"
    ON signal_detection_config FOR SELECT
    USING (
        level = 'user' AND
        user_id = auth.uid()
    );

-- Policy: Only super admins can modify platform config
CREATE POLICY "Platform config modifiable by super admin"
    ON signal_detection_config FOR ALL
    USING (
        level = 'platform' AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Policy: Org admins can modify their org config
CREATE POLICY "Org config modifiable by org admin"
    ON signal_detection_config FOR ALL
    USING (
        level = 'organization' AND
        organization = (
            SELECT organization FROM user_profiles 
            WHERE id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can modify their own user config
CREATE POLICY "User config modifiable by owner"
    ON signal_detection_config FOR ALL
    USING (
        level = 'user' AND
        user_id = auth.uid()
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signal_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signal_config_updated_at
    BEFORE UPDATE ON signal_detection_config
    FOR EACH ROW
    EXECUTE FUNCTION update_signal_config_updated_at();

-- Insert default platform configuration
INSERT INTO signal_detection_config (level, config, notes)
VALUES (
    'platform',
    '{
        "layer1_weights": {"rarity": 0.40, "seriousness": 0.35, "recency": 0.20, "count": 0.05},
        "interaction_thresholds": {"rare_serious": 0.7, "rare_recent": 0.7, "serious_recent": 0.7, "all_three": 0.6},
        "interaction_boosts": {"rare_serious": 0.15, "rare_recent": 0.10, "serious_recent": 0.10, "all_three": 0.20},
        "tunneling_range": {"min": 0.5, "max": 0.7, "boost_per_component": 0.05},
        "layer2_weights": {"frequency": 0.25, "severity": 0.20, "burst": 0.15, "novelty": 0.15, "consensus": 0.15, "mechanism": 0.10},
        "source_priorities": {"faers": 0.40, "rwe": 0.25, "clinicaltrials": 0.15, "pubmed": 0.10, "social": 0.07, "label": 0.03},
        "frequency_thresholds": {"100": {"score": 1.0}, "50": {"score": 0.8}, "20": {"score": 0.6}, "10": {"score": 0.4}, "5": {"score": 0.3}, "3": {"score": 0.2}, "1": {"score": 0.1}},
        "consensus_boost": {"high_conf_threshold": 0.7, "high_conf_strength_threshold": 0.7, "min_high_conf_sources": 3, "boost_amount": 0.2},
        "fusion_weights": {"bayesian": 0.35, "quantum_layer1": 0.40, "quantum_layer2": 0.25},
        "alert_levels": {"critical": 0.95, "high": 0.80, "moderate": 0.65, "watchlist": 0.45, "low": 0.25},
        "seriousness_weights": {"flag_base": 0.5, "death": 0.5, "hospitalization": 0.3, "disability": 0.2, "serious_fraction": 0.3},
        "recency_config": {"recent_days": 365, "moderate_days": 730, "recent_weight": 1.0, "moderate_weight": 0.5, "old_weight": 0.2},
        "novelty_config": {"very_recent_days": 30, "recent_days": 90, "moderate_days": 180, "old_days": 365, "on_label_recent_days": 30, "on_label_moderate_days": 90}
    }'::jsonb,
    'Default platform configuration - can be overridden at organization or user level'
)
ON CONFLICT (level) WHERE level = 'platform' DO NOTHING;

