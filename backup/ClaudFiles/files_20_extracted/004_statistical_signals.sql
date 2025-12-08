-- Database Migration: Add Statistical Signal Detection Fields
-- Version: 004_statistical_signals
-- Date: 2024-12-08
-- Purpose: Add PRR, ROR, IC fields for proper signal detection

-- Add statistical calculation fields to pv_cases table
ALTER TABLE pv_cases ADD COLUMN IF NOT EXISTS
    -- PRR (Proportional Reporting Ratio)
    prr FLOAT,
    prr_ci_lower FLOAT,
    prr_ci_upper FLOAT,
    prr_is_signal BOOLEAN DEFAULT false,
    
    -- ROR (Reporting Odds Ratio)
    ror FLOAT,
    ror_ci_lower FLOAT,
    ror_ci_upper FLOAT,
    ror_is_signal BOOLEAN DEFAULT false,
    
    -- IC (Information Component - Bayesian)
    ic FLOAT,
    ic025 FLOAT,  -- Lower bound of 95% credibility interval
    ic_is_signal BOOLEAN DEFAULT false,
    
    -- Overall signal assessment
    is_statistical_signal BOOLEAN DEFAULT false,
    signal_strength TEXT,  -- 'strong', 'moderate', 'weak', 'none'
    signal_methods TEXT[],  -- Array of methods that flagged signal
    signal_detected_at TIMESTAMP,
    signal_priority TEXT,  -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    
    -- Last calculation timestamp
    statistics_calculated_at TIMESTAMP,
    statistics_version TEXT DEFAULT '1.0';

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
