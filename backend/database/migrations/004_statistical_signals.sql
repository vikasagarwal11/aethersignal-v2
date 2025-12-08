-- Database Migration: Add Statistical Signal Detection Fields

-- Version: 004_statistical_signals

-- Date: 2024-12-08

-- Purpose: Add PRR, ROR, IC fields for proper signal detection

-- Add statistical calculation fields to pv_cases table

-- PRR (Proportional Reporting Ratio)
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS prr FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS prr_ci_lower FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS prr_ci_upper FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS prr_is_signal BOOLEAN DEFAULT false;

-- ROR (Reporting Odds Ratio)
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ror FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ror_ci_lower FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ror_ci_upper FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ror_is_signal BOOLEAN DEFAULT false;

-- IC (Information Component - Bayesian)
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ic FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ic025 FLOAT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS ic_is_signal BOOLEAN DEFAULT false;

-- Overall signal assessment
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS is_statistical_signal BOOLEAN DEFAULT false;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS signal_strength TEXT;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS signal_methods TEXT[];
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS signal_detected_at TIMESTAMP;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS signal_priority TEXT;

-- Last calculation timestamp
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS statistics_calculated_at TIMESTAMP;
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS statistics_version TEXT DEFAULT '1.0';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pv_cases_is_signal 
    ON pv_cases(is_statistical_signal) 
    WHERE is_statistical_signal = true;

CREATE INDEX IF NOT EXISTS idx_pv_cases_signal_strength 
    ON pv_cases(signal_strength) 
    WHERE signal_strength IN ('strong', 'moderate');

CREATE INDEX IF NOT EXISTS idx_pv_cases_drug_event 
    ON pv_cases(drug_name, reaction);

-- Add comment explaining fields
COMMENT ON COLUMN pv_cases.prr IS 'Proportional Reporting Ratio - FDA/WHO standard signal detection metric';
COMMENT ON COLUMN pv_cases.ror IS 'Reporting Odds Ratio - Alternative signal detection metric';
COMMENT ON COLUMN pv_cases.ic IS 'Information Component - Bayesian signal detection metric (WHO VigiBase)';
COMMENT ON COLUMN pv_cases.signal_strength IS 'Overall signal strength: strong (all methods), moderate (2 methods), weak (1 method), none';

-- Verification query
SELECT 
    'Migration 004_statistical_signals completed' as status,
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE is_statistical_signal = true) as cases_with_signals
FROM pv_cases;
