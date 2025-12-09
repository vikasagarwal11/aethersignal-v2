"""
Causality Assessment Module
============================

Implements standardized causality assessment algorithms:
- WHO-UMC (World Health Organization Uppsala Monitoring Centre)
- Naranjo Algorithm (Adverse Drug Reaction Probability Scale)
- Enhanced scoring with clinical features

Used to determine the likelihood that a drug caused an adverse event.

Author: AetherSignal Team
Date: 2024-12-08
Version: 1.0.0
"""

from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta


# ============================================================================
# ENUMERATIONS
# ============================================================================

class CausalityCategory(Enum):
    """WHO-UMC causality categories"""
    CERTAIN = "certain"
    PROBABLE = "probable"
    POSSIBLE = "possible"
    UNLIKELY = "unlikely"
    CONDITIONAL = "conditional"
    UNASSESSABLE = "unassessable"


class NaranjoScore(Enum):
    """Naranjo algorithm score ranges"""
    DEFINITE = "definite"         # Score ≥ 9
    PROBABLE = "probable"          # Score 5-8
    POSSIBLE = "possible"          # Score 1-4
    DOUBTFUL = "doubtful"          # Score ≤ 0


class DechallengeResult(Enum):
    """Outcome when drug is stopped"""
    POSITIVE = "positive"          # AE improved/resolved
    NEGATIVE = "negative"          # AE continued
    NOT_DONE = "not_done"
    UNKNOWN = "unknown"


class RechallengeResult(Enum):
    """Outcome when drug is restarted"""
    POSITIVE = "positive"          # AE recurred
    NEGATIVE = "negative"          # AE did not recur
    NOT_DONE = "not_done"
    UNKNOWN = "unknown"


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class ClinicalFeatures:
    """Clinical features relevant for causality assessment"""
    # Temporal relationship
    time_to_onset_days: Optional[int] = None
    drug_start_date: Optional[datetime] = None
    event_onset_date: Optional[datetime] = None
    drug_stop_date: Optional[datetime] = None
    
    # De-challenge (drug stopped)
    dechallenge_result: DechallengeResult = DechallengeResult.UNKNOWN
    dechallenge_improved: bool = False
    
    # Re-challenge (drug restarted)
    rechallenge_result: RechallengeResult = RechallengeResult.NOT_DONE
    rechallenge_recurred: bool = False
    
    # Alternative causes
    alternative_causes_present: bool = False
    alternative_causes: List[str] = None
    
    # Route of administration
    route_of_administration: Optional[str] = None  # oral, IV, topical, etc.
    route_is_plausible: bool = True
    
    # Dose relationship
    dose_increased_before_event: bool = False
    dose_response_relationship: bool = False
    
    # Concomitant medications
    concomitant_drugs: List[str] = None
    concomitant_drugs_could_cause_event: bool = False
    
    # Previous experience
    event_known_for_drug: bool = False
    event_in_labeling: bool = False
    previous_similar_reaction: bool = False
    
    # Laboratory tests
    drug_level_toxic: Optional[bool] = None
    objective_evidence: bool = False
    
    # Patient factors
    indication_for_use: Optional[str] = None
    indication_could_cause_event: bool = False
    
    def __post_init__(self):
        if self.alternative_causes is None:
            self.alternative_causes = []
        if self.concomitant_drugs is None:
            self.concomitant_drugs = []
        
        # Calculate time to onset if dates provided
        if (self.time_to_onset_days is None and 
            self.drug_start_date and self.event_onset_date):
            delta = self.event_onset_date - self.drug_start_date
            self.time_to_onset_days = delta.days


@dataclass
class CausalityAssessment:
    """Complete causality assessment result"""
    drug: str
    event: str
    
    # WHO-UMC assessment
    who_category: CausalityCategory
    who_reasoning: str
    
    # Naranjo assessment
    naranjo_score: int
    naranjo_category: NaranjoScore
    naranjo_details: Dict[str, Any]
    
    # Overall assessment
    causality_confidence: float  # 0-1
    primary_factors: List[str]
    supporting_factors: List[str]
    conflicting_factors: List[str]
    
    # Recommendations
    recommendation: str
    clinical_action: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "drug": self.drug,
            "event": self.event,
            "who_umc": {
                "category": self.who_category.value,
                "reasoning": self.who_reasoning
            },
            "naranjo": {
                "score": self.naranjo_score,
                "category": self.naranjo_category.value,
                "details": self.naranjo_details
            },
            "assessment": {
                "confidence": round(self.causality_confidence, 3),
                "primary_factors": self.primary_factors,
                "supporting_factors": self.supporting_factors,
                "conflicting_factors": self.conflicting_factors
            },
            "recommendations": {
                "clinical_action": self.clinical_action,
                "recommendation": self.recommendation
            }
        }


# ============================================================================
# WHO-UMC CAUSALITY ASSESSMENT
# ============================================================================

class WHOCausalityAssessor:
    """
    WHO-UMC Causality Assessment System
    
    Categories:
    1. CERTAIN: Event/reaction follows a reasonable temporal sequence,
       cannot be explained by other factors, pharmacologically/
       phenomenologically definitive, rechallenge satisfactory
       
    2. PROBABLE/LIKELY: Reasonable temporal sequence, unlikely to be 
       attributed to other factors, drug withdrawal information available
       
    3. POSSIBLE: Reasonable temporal sequence but could be explained by
       other factors
       
    4. UNLIKELY: Event not temporal sequence OR other factors more likely
    
    5. CONDITIONAL/UNCLASSIFIED: Need more data
    
    6. UNASSESSABLE/UNCLASSIFIABLE: Cannot evaluate
    """
    
    @staticmethod
    def assess(
        drug: str,
        event: str,
        features: ClinicalFeatures
    ) -> Tuple[CausalityCategory, str]:
        """
        Assess causality using WHO-UMC criteria.
        
        Args:
            drug: Drug name
            event: Event/reaction name
            features: Clinical features
            
        Returns:
            (category, reasoning)
        """
        reasoning_parts = []
        
        # Check for CERTAIN
        if WHOCausalityAssessor._is_certain(features):
            reasoning = "Temporal sequence reasonable, rechallenge positive, " \
                       "no alternative causes, pharmacologically plausible"
            return CausalityCategory.CERTAIN, reasoning
        
        # Check for PROBABLE
        if WHOCausalityAssessor._is_probable(features):
            reasoning_parts.append("Reasonable temporal sequence")
            
            if features.dechallenge_improved:
                reasoning_parts.append("positive de-challenge")
            
            if not features.alternative_causes_present:
                reasoning_parts.append("no alternative causes")
            
            if features.event_known_for_drug:
                reasoning_parts.append("known reaction for drug")
            
            reasoning = ", ".join(reasoning_parts)
            return CausalityCategory.PROBABLE, reasoning
        
        # Check for POSSIBLE
        if WHOCausalityAssessor._is_possible(features):
            reasoning_parts.append("Temporal sequence present")
            
            if features.alternative_causes_present:
                reasoning_parts.append(f"alternative causes exist: "
                    f"{', '.join(features.alternative_causes[:2])}")
            
            if features.concomitant_drugs_could_cause_event:
                reasoning_parts.append("concomitant drugs could contribute")
            
            reasoning = ", ".join(reasoning_parts)
            return CausalityCategory.POSSIBLE, reasoning
        
        # Check for UNLIKELY
        if WHOCausalityAssessor._is_unlikely(features):
            reasoning = "Temporal sequence implausible or strong alternative causes"
            return CausalityCategory.UNLIKELY, reasoning
        
        # Default: CONDITIONAL (need more data)
        reasoning = "Insufficient information to assess causality"
        return CausalityCategory.CONDITIONAL, reasoning
    
    @staticmethod
    def _is_certain(features: ClinicalFeatures) -> bool:
        """Check if meets CERTAIN criteria"""
        return (
            WHOCausalityAssessor._reasonable_temporal_sequence(features) and
            features.rechallenge_recurred and
            not features.alternative_causes_present and
            features.route_is_plausible
        )
    
    @staticmethod
    def _is_probable(features: ClinicalFeatures) -> bool:
        """Check if meets PROBABLE criteria"""
        return (
            WHOCausalityAssessor._reasonable_temporal_sequence(features) and
            (features.dechallenge_improved or 
             not features.alternative_causes_present or
             features.event_known_for_drug)
        )
    
    @staticmethod
    def _is_possible(features: ClinicalFeatures) -> bool:
        """Check if meets POSSIBLE criteria"""
        return WHOCausalityAssessor._reasonable_temporal_sequence(features)
    
    @staticmethod
    def _is_unlikely(features: ClinicalFeatures) -> bool:
        """Check if meets UNLIKELY criteria"""
        if not WHOCausalityAssessor._reasonable_temporal_sequence(features):
            return True
        
        if (features.alternative_causes_present and 
            len(features.alternative_causes) >= 2):
            return True
        
        if features.indication_could_cause_event:
            return True
        
        return False
    
    @staticmethod
    def _reasonable_temporal_sequence(features: ClinicalFeatures) -> bool:
        """
        Determine if temporal sequence is reasonable.
        
        Generally:
        - Immediate reactions: 0-24 hours
        - Early reactions: 1-7 days
        - Delayed reactions: 7-30 days
        - Late reactions: > 30 days (possible but less likely)
        """
        if features.time_to_onset_days is None:
            return True  # Benefit of doubt if unknown
        
        days = features.time_to_onset_days
        
        # Most AEs occur within 30 days
        if 0 <= days <= 30:
            return True
        
        # Some drugs have delayed reactions (e.g., immunotherapy)
        if 30 < days <= 90:
            return True  # Possible but needs additional support
        
        # Very late reactions are unlikely (unless chronic exposure)
        return False


# ============================================================================
# NARANJO ALGORITHM
# ============================================================================

class NaranjoAlgorithm:
    """
    Naranjo Adverse Drug Reaction Probability Scale
    
    Scores range from -4 to +13:
    - ≥ 9: Definite ADR
    - 5-8: Probable ADR
    - 1-4: Possible ADR
    - ≤ 0: Doubtful ADR
    
    10 questions, each with Yes (+points), No (-points), or Unknown (0).
    """
    
    # Naranjo questions and point values
    QUESTIONS = [
        {
            "id": 1,
            "text": "Are there previous conclusive reports on this reaction?",
            "yes": +1, "no": 0, "unknown": 0
        },
        {
            "id": 2,
            "text": "Did the adverse event appear after the suspected drug was given?",
            "yes": +2, "no": -1, "unknown": 0
        },
        {
            "id": 3,
            "text": "Did the adverse reaction improve when drug was discontinued or antagonist given?",
            "yes": +1, "no": 0, "unknown": 0
        },
        {
            "id": 4,
            "text": "Did the adverse reaction appear when the drug was readministered?",
            "yes": +2, "no": -1, "unknown": 0
        },
        {
            "id": 5,
            "text": "Are there alternative causes that could have caused the reaction?",
            "yes": -1, "no": +2, "unknown": 0
        },
        {
            "id": 6,
            "text": "Did the reaction reappear when a placebo was given?",
            "yes": -1, "no": +1, "unknown": 0
        },
        {
            "id": 7,
            "text": "Was the drug detected in any body fluid in toxic concentrations?",
            "yes": +1, "no": 0, "unknown": 0
        },
        {
            "id": 8,
            "text": "Was the reaction more severe when dose increased or less severe when decreased?",
            "yes": +1, "no": 0, "unknown": 0
        },
        {
            "id": 9,
            "text": "Did the patient have a similar reaction to the same or similar drugs before?",
            "yes": +1, "no": 0, "unknown": 0
        },
        {
            "id": 10,
            "text": "Was the adverse event confirmed by objective evidence?",
            "yes": +1, "no": 0, "unknown": 0
        }
    ]
    
    @staticmethod
    def calculate_score(features: ClinicalFeatures) -> Tuple[int, Dict[str, Any]]:
        """
        Calculate Naranjo score from clinical features.
        
        Args:
            features: Clinical features
            
        Returns:
            (total_score, question_details)
        """
        score = 0
        details = {}
        
        # Q1: Previous reports
        if features.event_known_for_drug or features.event_in_labeling:
            answer = "yes"
            score += 1
        else:
            answer = "unknown"
        details["q1_previous_reports"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        # Q2: Temporal sequence
        if features.time_to_onset_days is not None:
            answer = "yes"
            score += 2
        else:
            answer = "unknown"
        details["q2_temporal_sequence"] = {"answer": answer, "points": 2 if answer == "yes" else 0}
        
        # Q3: De-challenge
        if features.dechallenge_result == DechallengeResult.POSITIVE:
            answer = "yes"
            score += 1
        elif features.dechallenge_result == DechallengeResult.NEGATIVE:
            answer = "no"
        else:
            answer = "unknown"
        details["q3_dechallenge"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        # Q4: Re-challenge
        if features.rechallenge_result == RechallengeResult.POSITIVE:
            answer = "yes"
            score += 2
        elif features.rechallenge_result == RechallengeResult.NEGATIVE:
            answer = "no"
            score -= 1
        else:
            answer = "unknown"
        details["q4_rechallenge"] = {"answer": answer, "points": 2 if answer == "yes" else 0}
        
        # Q5: Alternative causes
        if features.alternative_causes_present:
            answer = "yes"
            score -= 1
        else:
            answer = "no"
            score += 2
        details["q5_alternative_causes"] = {"answer": answer, 
                                           "points": -1 if answer == "yes" else 2}
        
        # Q6: Placebo (usually unknown in spontaneous reports)
        answer = "unknown"
        details["q6_placebo"] = {"answer": answer, "points": 0}
        
        # Q7: Drug level toxic
        if features.drug_level_toxic is True:
            answer = "yes"
            score += 1
        elif features.drug_level_toxic is False:
            answer = "no"
        else:
            answer = "unknown"
        details["q7_toxic_level"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        # Q8: Dose-response
        if features.dose_response_relationship or features.dose_increased_before_event:
            answer = "yes"
            score += 1
        else:
            answer = "unknown"
        details["q8_dose_response"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        # Q9: Previous similar reaction
        if features.previous_similar_reaction:
            answer = "yes"
            score += 1
        else:
            answer = "unknown"
        details["q9_previous_reaction"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        # Q10: Objective evidence
        if features.objective_evidence:
            answer = "yes"
            score += 1
        else:
            answer = "unknown"
        details["q10_objective_evidence"] = {"answer": answer, "points": 1 if answer == "yes" else 0}
        
        details["total_score"] = score
        
        return score, details
    
    @staticmethod
    def categorize_score(score: int) -> NaranjoScore:
        """
        Categorize Naranjo score into probability level.
        
        Args:
            score: Total Naranjo score
            
        Returns:
            Probability category
        """
        if score >= 9:
            return NaranjoScore.DEFINITE
        elif score >= 5:
            return NaranjoScore.PROBABLE
        elif score >= 1:
            return NaranjoScore.POSSIBLE
        else:
            return NaranjoScore.DOUBTFUL


# ============================================================================
# COMPREHENSIVE CAUSALITY ASSESSOR
# ============================================================================

class CausalityAssessor:
    """
    Comprehensive causality assessment combining WHO-UMC and Naranjo.
    
    Provides integrated assessment with clinical recommendations.
    """
    
    def __init__(self):
        self.who_assessor = WHOCausalityAssessor()
        self.naranjo = NaranjoAlgorithm()
    
    def assess(
        self,
        drug: str,
        event: str,
        features: ClinicalFeatures
    ) -> CausalityAssessment:
        """
        Perform comprehensive causality assessment.
        
        Args:
            drug: Drug name
            event: Event/reaction name
            features: Clinical features
            
        Returns:
            Complete causality assessment
        """
        # WHO-UMC assessment
        who_category, who_reasoning = self.who_assessor.assess(drug, event, features)
        
        # Naranjo assessment
        naranjo_score, naranjo_details = self.naranjo.calculate_score(features)
        naranjo_category = self.naranjo.categorize_score(naranjo_score)
        
        # Calculate overall confidence
        confidence = self._calculate_confidence(who_category, naranjo_score, features)
        
        # Identify key factors
        primary, supporting, conflicting = self._identify_factors(features)
        
        # Generate recommendations
        recommendation, clinical_action = self._generate_recommendations(
            who_category, naranjo_category, features
        )
        
        return CausalityAssessment(
            drug=drug,
            event=event,
            who_category=who_category,
            who_reasoning=who_reasoning,
            naranjo_score=naranjo_score,
            naranjo_category=naranjo_category,
            naranjo_details=naranjo_details,
            causality_confidence=confidence,
            primary_factors=primary,
            supporting_factors=supporting,
            conflicting_factors=conflicting,
            recommendation=recommendation,
            clinical_action=clinical_action
        )
    
    def _calculate_confidence(
        self,
        who_category: CausalityCategory,
        naranjo_score: int,
        features: ClinicalFeatures
    ) -> float:
        """Calculate overall confidence in causality assessment"""
        
        # Base confidence from WHO category
        confidence_map = {
            CausalityCategory.CERTAIN: 0.95,
            CausalityCategory.PROBABLE: 0.75,
            CausalityCategory.POSSIBLE: 0.50,
            CausalityCategory.UNLIKELY: 0.25,
            CausalityCategory.CONDITIONAL: 0.40,
            CausalityCategory.UNASSESSABLE: 0.20
        }
        base_confidence = confidence_map[who_category]
        
        # Adjust based on Naranjo score
        if naranjo_score >= 9:
            naranjo_boost = 0.10
        elif naranjo_score >= 5:
            naranjo_boost = 0.05
        else:
            naranjo_boost = 0.0
        
        # Boost for strong evidence
        evidence_boost = 0.0
        if features.rechallenge_recurred:
            evidence_boost += 0.15
        elif features.dechallenge_improved:
            evidence_boost += 0.08
        
        if not features.alternative_causes_present:
            evidence_boost += 0.05
        
        # Final confidence (capped at 0.98)
        confidence = min(base_confidence + naranjo_boost + evidence_boost, 0.98)
        
        return confidence
    
    def _identify_factors(
        self,
        features: ClinicalFeatures
    ) -> Tuple[List[str], List[str], List[str]]:
        """Identify primary, supporting, and conflicting factors"""
        
        primary = []
        supporting = []
        conflicting = []
        
        # Temporal relationship
        if features.time_to_onset_days is not None:
            if features.time_to_onset_days <= 7:
                primary.append(f"Temporal relationship strong (onset in {features.time_to_onset_days} days)")
            elif features.time_to_onset_days <= 30:
                supporting.append(f"Temporal relationship present (onset in {features.time_to_onset_days} days)")
            else:
                conflicting.append(f"Delayed onset ({features.time_to_onset_days} days)")
        
        # De-challenge
        if features.dechallenge_improved:
            primary.append("Positive de-challenge (AE improved when drug stopped)")
        
        # Re-challenge
        if features.rechallenge_recurred:
            primary.append("Positive re-challenge (AE recurred when drug restarted)")
        
        # Alternative causes
        if features.alternative_causes_present:
            conflicting.append(f"Alternative causes present: {', '.join(features.alternative_causes)}")
        else:
            supporting.append("No alternative causes identified")
        
        # Known reaction
        if features.event_known_for_drug:
            supporting.append("Known reaction for this drug class")
        
        if features.event_in_labeling:
            supporting.append("Listed in product labeling")
        
        # Concomitant drugs
        if features.concomitant_drugs_could_cause_event:
            conflicting.append("Concomitant medications could contribute")
        
        # Dose relationship
        if features.dose_response_relationship:
            primary.append("Dose-response relationship observed")
        
        return primary, supporting, conflicting
    
    def _generate_recommendations(
        self,
        who_category: CausalityCategory,
        naranjo_category: NaranjoScore,
        features: ClinicalFeatures
    ) -> Tuple[str, str]:
        """Generate clinical recommendations"""
        
        # High causality
        if who_category in [CausalityCategory.CERTAIN, CausalityCategory.PROBABLE]:
            recommendation = "Strong causal relationship established. Consider as validated signal."
            clinical_action = "Recommend drug discontinuation or close monitoring. " \
                            "Report to regulatory authorities if serious."
        
        # Moderate causality
        elif who_category == CausalityCategory.POSSIBLE:
            recommendation = "Possible causal relationship. Further evaluation recommended."
            clinical_action = "Continue monitoring. Consider dose adjustment or alternative therapy. " \
                            "Document in patient record."
        
        # Low causality
        elif who_category == CausalityCategory.UNLIKELY:
            recommendation = "Causal relationship unlikely. Consider alternative causes."
            clinical_action = "May continue therapy if clinical benefit outweighs risk. " \
                            "Investigate alternative etiologies."
        
        # Insufficient data
        else:
            recommendation = "Insufficient data for causality assessment."
            clinical_action = "Gather additional information: de-challenge/re-challenge data, " \
                            "concomitant medications, timing, alternative causes."
        
        return recommendation, clinical_action


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example: Strong causality case
    features = ClinicalFeatures(
        time_to_onset_days=3,
        dechallenge_result=DechallengeResult.POSITIVE,
        dechallenge_improved=True,
        rechallenge_result=RechallengeResult.POSITIVE,
        rechallenge_recurred=True,
        alternative_causes_present=False,
        route_of_administration="oral",
        route_is_plausible=True,
        event_known_for_drug=True,
        event_in_labeling=True,
        objective_evidence=True
    )
    
    assessor = CausalityAssessor()
    result = assessor.assess("Aspirin", "Gastric Ulcer", features)
    
    print("\n" + "="*80)
    print("CAUSALITY ASSESSMENT RESULTS")
    print("="*80 + "\n")
    
    print(f"Drug: {result.drug}, Event: {result.event}\n")
    
    print("WHO-UMC Assessment:")
    print(f"  Category: {result.who_category.value.upper()}")
    print(f"  Reasoning: {result.who_reasoning}\n")
    
    print("Naranjo Algorithm:")
    print(f"  Score: {result.naranjo_score}")
    print(f"  Category: {result.naranjo_category.value.upper()}\n")
    
    print(f"Overall Confidence: {result.causality_confidence:.2%}\n")
    
    print("Primary Factors:")
    for factor in result.primary_factors:
        print(f"  • {factor}")
    
    print("\nSupporting Factors:")
    for factor in result.supporting_factors:
        print(f"  • {factor}")
    
    if result.conflicting_factors:
        print("\nConflicting Factors:")
        for factor in result.conflicting_factors:
            print(f"  • {factor}")
    
    print(f"\nRecommendation: {result.recommendation}")
    print(f"Clinical Action: {result.clinical_action}")
