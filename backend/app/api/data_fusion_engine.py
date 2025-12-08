"""
Cross-Source Data Fusion Engine
Patent-worthy: Multi-source pharmacovigilance data reconciliation with AI-powered conflict resolution

Intelligently merges data from multiple sources:
- FAERS public database
- Internal company data
- E2B reports
- Excel uploads
- Clinical trial data

Handles conflicts with provenance tracking and AI resolution
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
from collections import Counter

logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Data source types"""
    FAERS = "faers"
    INTERNAL = "internal"
    E2B = "e2b"
    EXCEL = "excel"
    CLINICAL_TRIAL = "clinical_trial"
    MANUAL = "manual"


class ConflictResolutionStrategy(Enum):
    """Strategies for resolving conflicts"""
    MOST_RECENT = "most_recent"  # Use most recent value
    HIGHEST_CONFIDENCE = "highest_confidence"  # Use source with highest confidence
    CONSENSUS = "consensus"  # Use value that appears most often
    MANUAL_REVIEW = "manual_review"  # Flag for human review
    SOURCE_PRIORITY = "source_priority"  # Use predefined source priority


@dataclass
class DataSourceMetadata:
    """Metadata about a data source"""
    source: DataSource
    source_id: str
    confidence: float  # 0.0 - 1.0
    timestamp: datetime
    reporter_type: Optional[str] = None
    data_quality_score: float = 0.8


@dataclass
class FieldValue:
    """A field value from a specific source"""
    value: Any
    source_metadata: DataSourceMetadata
    
    def __hash__(self):
        return hash((str(self.value), self.source_metadata.source, self.source_metadata.source_id))


@dataclass
class FieldConflict:
    """Represents a conflict between sources"""
    field_name: str
    values: List[FieldValue]
    resolution_strategy: ConflictResolutionStrategy
    resolved_value: Any = None
    confidence: float = 0.0
    requires_review: bool = False
    explanation: str = ""


@dataclass
class UnifiedCase:
    """Unified case after data fusion"""
    case_id: str
    fields: Dict[str, Any] = field(default_factory=dict)
    provenance: Dict[str, List[DataSource]] = field(default_factory=dict)  # Which sources contributed each field
    conflicts: List[FieldConflict] = field(default_factory=list)
    source_cases: List[Dict[str, Any]] = field(default_factory=list)
    data_quality_score: float = 0.0
    needs_manual_review: bool = False


class DataFusionEngine:
    """
    AI-powered engine for merging data from multiple sources
    """
    
    # Source priority (higher = more trusted)
    SOURCE_PRIORITY = {
        DataSource.E2B: 1.0,  # Regulatory reports - highest priority
        DataSource.CLINICAL_TRIAL: 0.95,  # Controlled data collection
        DataSource.INTERNAL: 0.9,  # Company's own data
        DataSource.FAERS: 0.7,  # Public database - quality varies
        DataSource.EXCEL: 0.6,  # User uploads - quality varies
        DataSource.MANUAL: 0.5  # Manual entry - prone to errors
    }
    
    # Field-specific resolution strategies
    FIELD_STRATEGIES = {
        'case_number': ConflictResolutionStrategy.SOURCE_PRIORITY,
        'patient_age': ConflictResolutionStrategy.CONSENSUS,
        'patient_sex': ConflictResolutionStrategy.CONSENSUS,
        'patient_weight': ConflictResolutionStrategy.MOST_RECENT,
        'drug_name': ConflictResolutionStrategy.SOURCE_PRIORITY,
        'reaction': ConflictResolutionStrategy.SOURCE_PRIORITY,
        'serious': ConflictResolutionStrategy.HIGHEST_CONFIDENCE,
        'outcome': ConflictResolutionStrategy.MOST_RECENT,
        'event_date': ConflictResolutionStrategy.CONSENSUS,
        'report_date': ConflictResolutionStrategy.MOST_RECENT,
        'narrative': ConflictResolutionStrategy.SOURCE_PRIORITY  # E2B narratives preferred
    }
    
    # Critical fields that require manual review if conflicted
    CRITICAL_FIELDS = {
        'serious', 'outcome', 'patient_age', 'drug_name', 'reaction'
    }
    
    def __init__(self):
        self.merged_cases_cache = {}
        
    def merge_sources(
        self, 
        source_cases: List[Tuple[Dict[str, Any], DataSourceMetadata]]
    ) -> UnifiedCase:
        """
        Merge multiple source cases into unified case
        
        Args:
            source_cases: List of (case_data, metadata) tuples
        
        Returns:
            UnifiedCase with resolved conflicts
        """
        if not source_cases:
            raise ValueError("No source cases provided")
        
        if len(source_cases) == 1:
            # Single source - no conflicts
            case_data, metadata = source_cases[0]
            return UnifiedCase(
                case_id=case_data.get('case_number', 'unknown'),
                fields=case_data,
                provenance={k: [metadata.source] for k in case_data.keys()},
                source_cases=[case_data],
                data_quality_score=metadata.data_quality_score
            )
        
        logger.info(f"Merging {len(source_cases)} source cases")
        
        # Extract all unique fields
        all_fields = set()
        for case_data, _ in source_cases:
            all_fields.update(case_data.keys())
        
        # Build unified case
        unified_case = UnifiedCase(
            case_id=self._generate_unified_case_id(source_cases),
            source_cases=[case_data for case_data, _ in source_cases]
        )
        
        # Process each field
        for field_name in all_fields:
            field_values = self._collect_field_values(field_name, source_cases)
            
            if len(field_values) == 1:
                # No conflict
                field_value = field_values[0]
                unified_case.fields[field_name] = field_value.value
                unified_case.provenance[field_name] = [field_value.source_metadata.source]
            else:
                # Conflict detected - resolve
                conflict = self._resolve_conflict(field_name, field_values)
                unified_case.conflicts.append(conflict)
                unified_case.fields[field_name] = conflict.resolved_value
                unified_case.provenance[field_name] = [
                    fv.source_metadata.source for fv in field_values
                ]
                
                if conflict.requires_review:
                    unified_case.needs_manual_review = True
        
        # Calculate overall data quality
        unified_case.data_quality_score = self._calculate_overall_quality(
            source_cases, 
            unified_case.conflicts
        )
        
        logger.info(
            f"Merge complete: {len(unified_case.conflicts)} conflicts resolved, "
            f"quality score: {unified_case.data_quality_score:.2f}"
        )
        
        return unified_case
    
    def _collect_field_values(
        self, 
        field_name: str, 
        source_cases: List[Tuple[Dict[str, Any], DataSourceMetadata]]
    ) -> List[FieldValue]:
        """
        Collect all values for a field from all sources
        Returns only unique values
        """
        field_values = []
        seen_values = set()
        
        for case_data, metadata in source_cases:
            if field_name in case_data:
                value = case_data[field_name]
                
                # Normalize value for comparison
                normalized = self._normalize_value(value)
                
                if normalized not in seen_values:
                    field_values.append(FieldValue(
                        value=value,
                        source_metadata=metadata
                    ))
                    seen_values.add(normalized)
        
        return field_values
    
    def _normalize_value(self, value: Any) -> Any:
        """Normalize value for comparison"""
        if value is None:
            return None
        
        if isinstance(value, str):
            # Lowercase and strip for strings
            return value.lower().strip()
        
        if isinstance(value, (int, float)):
            # Round floats for comparison
            return round(float(value), 2)
        
        if isinstance(value, datetime):
            # Date only (ignore time)
            return value.date()
        
        return value
    
    def _resolve_conflict(
        self, 
        field_name: str, 
        field_values: List[FieldValue]
    ) -> FieldConflict:
        """
        Resolve conflict between multiple field values
        """
        # Determine resolution strategy
        strategy = self.FIELD_STRATEGIES.get(
            field_name, 
            ConflictResolutionStrategy.CONSENSUS
        )
        
        conflict = FieldConflict(
            field_name=field_name,
            values=field_values,
            resolution_strategy=strategy
        )
        
        # Apply resolution strategy
        if strategy == ConflictResolutionStrategy.CONSENSUS:
            conflict.resolved_value, conflict.confidence = self._resolve_by_consensus(field_values)
        
        elif strategy == ConflictResolutionStrategy.MOST_RECENT:
            conflict.resolved_value, conflict.confidence = self._resolve_by_most_recent(field_values)
        
        elif strategy == ConflictResolutionStrategy.HIGHEST_CONFIDENCE:
            conflict.resolved_value, conflict.confidence = self._resolve_by_confidence(field_values)
        
        elif strategy == ConflictResolutionStrategy.SOURCE_PRIORITY:
            conflict.resolved_value, conflict.confidence = self._resolve_by_source_priority(field_values)
        
        else:
            # Manual review
            conflict.resolved_value = field_values[0].value
            conflict.confidence = 0.0
            conflict.requires_review = True
        
        # Check if manual review needed
        if field_name in self.CRITICAL_FIELDS:
            if conflict.confidence < 0.8 or len(field_values) > 2:
                conflict.requires_review = True
        
        # Generate explanation
        conflict.explanation = self._generate_conflict_explanation(conflict)
        
        return conflict
    
    def _resolve_by_consensus(self, field_values: List[FieldValue]) -> Tuple[Any, float]:
        """
        Resolve by consensus - value that appears most often
        """
        # Count occurrences
        value_counts = Counter(self._normalize_value(fv.value) for fv in field_values)
        most_common_normalized, count = value_counts.most_common(1)[0]
        
        # Find original value (not normalized)
        resolved_value = None
        for fv in field_values:
            if self._normalize_value(fv.value) == most_common_normalized:
                resolved_value = fv.value
                break
        
        # Confidence based on agreement
        confidence = count / len(field_values)
        
        return resolved_value, confidence
    
    def _resolve_by_most_recent(self, field_values: List[FieldValue]) -> Tuple[Any, float]:
        """
        Resolve by most recent timestamp
        """
        # Sort by timestamp
        sorted_values = sorted(
            field_values, 
            key=lambda fv: fv.source_metadata.timestamp, 
            reverse=True
        )
        
        most_recent = sorted_values[0]
        
        # Confidence based on how much newer it is
        if len(field_values) > 1:
            time_diff = (
                most_recent.source_metadata.timestamp - 
                sorted_values[1].source_metadata.timestamp
            ).days
            
            # Higher confidence if significantly newer
            if time_diff > 30:
                confidence = 0.95
            elif time_diff > 7:
                confidence = 0.85
            else:
                confidence = 0.75
        else:
            confidence = 1.0
        
        return most_recent.value, confidence
    
    def _resolve_by_confidence(self, field_values: List[FieldValue]) -> Tuple[Any, float]:
        """
        Resolve by source with highest confidence score
        """
        # Sort by source confidence
        sorted_values = sorted(
            field_values,
            key=lambda fv: fv.source_metadata.confidence,
            reverse=True
        )
        
        highest_confidence = sorted_values[0]
        
        return highest_confidence.value, highest_confidence.source_metadata.confidence
    
    def _resolve_by_source_priority(self, field_values: List[FieldValue]) -> Tuple[Any, float]:
        """
        Resolve by predefined source priority
        """
        # Sort by source priority
        sorted_values = sorted(
            field_values,
            key=lambda fv: self.SOURCE_PRIORITY.get(fv.source_metadata.source, 0.0),
            reverse=True
        )
        
        highest_priority = sorted_values[0]
        priority_score = self.SOURCE_PRIORITY.get(
            highest_priority.source_metadata.source, 
            0.5
        )
        
        return highest_priority.value, priority_score
    
    def _generate_unified_case_id(
        self, 
        source_cases: List[Tuple[Dict[str, Any], DataSourceMetadata]]
    ) -> str:
        """
        Generate unified case ID from source case IDs
        """
        case_numbers = []
        for case_data, metadata in source_cases:
            if 'case_number' in case_data:
                case_numbers.append(
                    f"{metadata.source.value}:{case_data['case_number']}"
                )
        
        return " | ".join(case_numbers) if case_numbers else "unified_case"
    
    def _calculate_overall_quality(
        self, 
        source_cases: List[Tuple[Dict[str, Any], DataSourceMetadata]],
        conflicts: List[FieldConflict]
    ) -> float:
        """
        Calculate overall data quality score
        
        Considers:
        - Average source quality
        - Number of conflicts
        - Conflict resolution confidence
        """
        # Average source quality
        avg_source_quality = sum(
            metadata.data_quality_score 
            for _, metadata in source_cases
        ) / len(source_cases)
        
        # Conflict penalty
        if conflicts:
            avg_conflict_confidence = sum(c.confidence for c in conflicts) / len(conflicts)
            conflict_penalty = (1 - avg_conflict_confidence) * 0.2
        else:
            conflict_penalty = 0.0
        
        # Manual review penalty
        manual_review_penalty = sum(1 for c in conflicts if c.requires_review) * 0.05
        
        overall_quality = avg_source_quality - conflict_penalty - manual_review_penalty
        
        return max(0.0, min(1.0, overall_quality))
    
    def _generate_conflict_explanation(self, conflict: FieldConflict) -> str:
        """
        Generate human-readable explanation of conflict resolution
        """
        sources = [fv.source_metadata.source.value for fv in conflict.values]
        values = [str(fv.value) for fv in conflict.values]
        
        explanation = (
            f"Conflict in '{conflict.field_name}': "
            f"{len(conflict.values)} different values from sources {', '.join(sources)}. "
        )
        
        if conflict.resolution_strategy == ConflictResolutionStrategy.CONSENSUS:
            explanation += f"Resolved by consensus to '{conflict.resolved_value}' "
            explanation += f"({conflict.confidence:.0%} agreement)."
        
        elif conflict.resolution_strategy == ConflictResolutionStrategy.MOST_RECENT:
            explanation += f"Resolved using most recent value: '{conflict.resolved_value}'."
        
        elif conflict.resolution_strategy == ConflictResolutionStrategy.HIGHEST_CONFIDENCE:
            explanation += f"Resolved using highest confidence source: '{conflict.resolved_value}'."
        
        elif conflict.resolution_strategy == ConflictResolutionStrategy.SOURCE_PRIORITY:
            explanation += f"Resolved using source priority: '{conflict.resolved_value}'."
        
        if conflict.requires_review:
            explanation += " ⚠️ FLAGGED FOR MANUAL REVIEW"
        
        return explanation
    
    def generate_fusion_report(self, unified_case: UnifiedCase) -> str:
        """
        Generate detailed fusion report
        """
        report_lines = [
            "=" * 80,
            "DATA FUSION REPORT",
            "=" * 80,
            "",
            f"Unified Case ID: {unified_case.case_id}",
            f"Source Cases: {len(unified_case.source_cases)}",
            f"Total Fields: {len(unified_case.fields)}",
            f"Conflicts Detected: {len(unified_case.conflicts)}",
            f"Data Quality Score: {unified_case.data_quality_score:.1%}",
            f"Manual Review Required: {'YES ⚠️' if unified_case.needs_manual_review else 'NO ✓'}",
            ""
        ]
        
        if unified_case.conflicts:
            report_lines.extend([
                "=" * 80,
                "CONFLICTS & RESOLUTIONS",
                "=" * 80,
                ""
            ])
            
            for conflict in unified_case.conflicts:
                status = "⚠️ REVIEW" if conflict.requires_review else "✓ RESOLVED"
                report_lines.extend([
                    f"{status} {conflict.field_name}:",
                    f"  Strategy: {conflict.resolution_strategy.value}",
                    f"  Confidence: {conflict.confidence:.1%}",
                    f"  Resolved Value: {conflict.resolved_value}",
                    f"  Conflicting Values:"
                ])
                
                for fv in conflict.values:
                    report_lines.append(
                        f"    - {fv.value} (from {fv.source_metadata.source.value})"
                    )
                
                report_lines.extend([
                    f"  Explanation: {conflict.explanation}",
                    ""
                ])
        
        report_lines.extend([
            "=" * 80,
            "PROVENANCE TRACKING",
            "=" * 80,
            ""
        ])
        
        for field_name, sources in unified_case.provenance.items():
            source_names = [s.value for s in sources]
            report_lines.append(
                f"{field_name:30s} → {', '.join(source_names)}"
            )
        
        return "\n".join(report_lines)


def merge_duplicate_cases(
    cases: List[Dict[str, Any]],
    source_metadatas: List[DataSourceMetadata]
) -> UnifiedCase:
    """
    Convenience function to merge duplicate cases
    
    Args:
        cases: List of case dictionaries
        source_metadatas: List of metadata for each case
    
    Returns:
        Unified case with conflicts resolved
    """
    engine = DataFusionEngine()
    source_cases = list(zip(cases, source_metadatas))
    unified = engine.merge_sources(source_cases)
    
    # Generate report
    report = engine.generate_fusion_report(unified)
    print(report)
    
    return unified

