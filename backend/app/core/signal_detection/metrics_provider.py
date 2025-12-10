"""
Metrics Provider for Query Router
=================================

Provides evidence data for the fusion engine from various data sources.
This is the "adapter" layer that connects QueryRouter to your database.

You can implement multiple providers:
- SupabaseMetricsProvider (for Supabase database)
- DataFrameMetricsProvider (for Pandas DataFrames)
- FAERSMetricsProvider (for FAERS parquet files)
"""

from __future__ import annotations

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from .query_router import SignalQuerySpec, MetricsProvider

logger = logging.getLogger(__name__)


def create_supabase_metrics_provider(supabase_client: Any) -> MetricsProvider:
    """
    Create a metrics provider that queries Supabase.

    Args:
        supabase_client: Your Supabase client instance

    Returns:
        MetricsProvider callable

    Usage:
        from supabase import create_client
        supabase = create_client(url, key)
        provider = create_supabase_metrics_provider(supabase)
        router = QueryRouter(fusion_engine, metrics_provider=provider)
    """
    def metrics_provider(drug: str, event: str, spec: SignalQuerySpec) -> Dict[str, Any]:
        """
        Query Supabase to build evidence dict for fusion engine.

        Expected Supabase table structure (matches your schema):
        - pv_cases table with:
          - drug_name (text) ✅
          - reaction (text) ✅
          - serious (boolean) ✅ (NOT is_serious)
          - event_date (date) or report_date (date) ✅
          - age_yrs (numeric) ✅
          - sex (text, optional) ✅
          - outcome (text, optional) ✅
        """
        try:
            # Build query
            query = supabase_client.table("pv_cases").select("*")

            # Filter by drug (case-insensitive)
            query = query.ilike("drug_name", f"%{drug}%")

            # Filter by event/reaction (case-insensitive)
            # Try both 'reaction' and 'event_term' columns
            if hasattr(query, 'or_'):
                query = query.or_(
                    f"reaction.ilike.%{event}%,event_term.ilike.%{event}%"
                )
            else:
                # Fallback: try reaction column first
                query = query.ilike("reaction", f"%{event}%")

            # Apply seriousness filter
            # Note: Schema uses 'serious' (boolean), not 'is_serious'
            if spec.seriousness_only:
                query = query.eq("serious", True)

            # Apply age filters
            if spec.age_min is not None:
                query = query.gte("age_yrs", spec.age_min)
            if spec.age_max is not None:
                query = query.lte("age_yrs", spec.age_max)

            # Apply time window filter
            if spec.time_window:
                from_date = _parse_time_window(spec.time_window)
                if from_date:
                    query = query.gte("event_date", from_date.isoformat())

            # Execute query
            response = query.execute()
            rows = response.data or []

            if not rows:
                logger.debug(f"No cases found for {drug} + {event}")
                return {}

            # Aggregate data
            count = len(rows)
            # Note: Schema uses 'serious' (boolean), not 'is_serious'
            serious_count = sum(1 for r in rows if r.get("serious", False))
            seriousness = "yes" if serious_count > 0 else "no"

            # Extract dates
            dates = []
            for r in rows:
                date_str = r.get("event_date") or r.get("report_date")
                if date_str:
                    try:
                        if isinstance(date_str, str):
                            dates.append(datetime.fromisoformat(date_str.replace("Z", "+00:00")))
                        elif isinstance(date_str, datetime):
                            dates.append(date_str)
                    except Exception:
                        pass

            # Extract outcomes
            outcomes = []
            for r in rows:
                outcome = r.get("outcome", "")
                if outcome:
                    outcomes.append(str(outcome))

            # Build signal_data dict
            signal_data = {
                "count": count,
                "serious_count": serious_count,
                "seriousness": seriousness,
                "dates": dates,
                "outcomes": outcomes,
                "sources": ["faers"],  # Default source, can be enhanced
            }

            # Calculate total_cases (denominator for rarity calculation)
            # Option 1: Query total cases in database
            total_response = supabase_client.table("pv_cases").select("id", count="exact").execute()
            total_cases = total_response.count if hasattr(total_response, 'count') else count * 10  # Fallback

            # Build evidence dict for CompleteFusionEngine.detect_signal()
            evidence = {
                "drug": drug,
                "event": event,
                "signal_data": signal_data,
                "total_cases": max(total_cases, count),  # Ensure at least count
                # Optional: Add contingency table, clinical features, time series if available
                "contingency_table": None,
                "clinical_features": None,
                "time_series": None,
                "sources": signal_data.get("sources"),
                "label_reactions": None,  # Can be populated from drug label data
            }

            return evidence

        except Exception as e:
            logger.exception(f"Error in metrics_provider for {drug} + {event}: {e}")
            return {}

    return metrics_provider


def _parse_time_window(time_window: str) -> Optional[datetime]:
    """
    Parse time window string to datetime.

    Examples:
        "LAST_6_MONTHS" -> datetime 6 months ago
        "LAST_12_MONTHS" -> datetime 12 months ago
        "SINCE_2020" -> datetime(2020, 1, 1)
        "2024-01-01" -> datetime(2024, 1, 1)
    """
    if not time_window:
        return None

    time_window = time_window.upper().strip()
    now = datetime.now()

    if time_window == "LAST_6_MONTHS":
        return now - timedelta(days=180)
    elif time_window == "LAST_12_MONTHS":
        return now - timedelta(days=365)
    elif time_window == "LAST_3_MONTHS":
        return now - timedelta(days=90)
    elif time_window.startswith("SINCE_"):
        year_str = time_window.replace("SINCE_", "")
        try:
            year = int(year_str)
            return datetime(year, 1, 1)
        except ValueError:
            return None
    else:
        # Try parsing as ISO date
        try:
            return datetime.fromisoformat(time_window)
        except ValueError:
            logger.warning(f"Could not parse time_window: {time_window}")
            return None


def create_dataframe_metrics_provider(df: Any) -> MetricsProvider:
    """
    Create a metrics provider that uses a Pandas DataFrame.

    Args:
        df: DataFrame with columns: drug_name, reaction, is_serious, event_date, etc.

    Returns:
        MetricsProvider callable
    """
    def metrics_provider(drug: str, event: str, spec: SignalQuerySpec) -> Dict[str, Any]:
        """Query DataFrame to build evidence dict."""
        try:
            # Filter DataFrame
            filtered = df[
                (df["drug_name"].str.contains(drug, case=False, na=False)) &
                (df["reaction"].str.contains(event, case=False, na=False))
            ]

            if spec.seriousness_only:
                filtered = filtered[filtered.get("is_serious", False) == True]

            if spec.age_min is not None:
                filtered = filtered[filtered.get("age_yrs", 0) >= spec.age_min]
            if spec.age_max is not None:
                filtered = filtered[filtered.get("age_yrs", 120) <= spec.age_max]

            # Apply time window
            if spec.time_window and PANDAS_AVAILABLE:
                from_date = _parse_time_window(spec.time_window)
                if from_date:
                    # Fix: Check if column exists in DataFrame, not Series
                    date_col = None
                    if "event_date" in filtered.columns:
                        date_col = "event_date"
                    elif "report_date" in filtered.columns:
                        date_col = "report_date"
                    
                    if date_col:
                        filtered = filtered[pd.to_datetime(filtered[date_col]) >= from_date]

            count = len(filtered)
            if count == 0:
                return {}

            # Fix: Handle missing columns properly
            if PANDAS_AVAILABLE:
                if "is_serious" in filtered.columns:
                    serious_count = int(filtered["is_serious"].sum())
                else:
                    serious_count = 0
                
                if "event_date" in filtered.columns:
                    dates = pd.to_datetime(filtered["event_date"], errors='coerce').dropna().tolist()
                elif "report_date" in filtered.columns:
                    dates = pd.to_datetime(filtered["report_date"], errors='coerce').dropna().tolist()
                else:
                    dates = []
            else:
                serious_count = sum(1 for _, row in filtered.iterrows() if row.get("is_serious", False))
                dates = [datetime.fromisoformat(d) for d in filtered.get("event_date", []) if d]

            signal_data = {
                "count": count,
                "serious_count": int(serious_count),
                "seriousness": "yes" if serious_count > 0 else "no",
                "dates": [d for d in dates if pd.notna(d)],
                "outcomes": filtered.get("outcome", []).tolist(),
                "sources": ["faers"],
            }

            evidence = {
                "drug": drug,
                "event": event,
                "signal_data": signal_data,
                "total_cases": len(df),  # Total cases in dataset
                "contingency_table": None,
                "clinical_features": None,
                "time_series": None,
                "sources": signal_data.get("sources"),
                "label_reactions": None,
            }

            return evidence

        except Exception as e:
            logger.exception(f"Error in DataFrame metrics_provider for {drug} + {event}: {e}")
            return {}

    return metrics_provider

