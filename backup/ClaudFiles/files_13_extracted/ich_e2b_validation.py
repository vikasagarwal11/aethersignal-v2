# ============================================================================
# ICH E2B VALIDATION MODULE
# ============================================================================
# Add this to your existing files.py to enable ICH E2B compliance validation
# Place it after the imports and before the create_cases_from_entities function
# ============================================================================

def validate_ich_e2b_compliance(case_data: dict) -> tuple[bool, list[str], str]:
    """
    Validate if case meets ICH E2B(R3) minimum criteria
    
    ICH E2B Minimum Criteria:
    1. Patient identification (age OR sex OR initials)
    2. Suspect product (drug name)
    3. Adverse event (reaction)
    4. At least one date (event OR drug start OR receipt)
    5. Reporter information
    
    Returns: (is_valid, missing_fields, completeness_status)
    """
    missing = []
    
    # Criterion 1: Patient identification (at least ONE of these)
    patient_identified = any([
        case_data.get("patient", {}).get("age"),
        case_data.get("patient", {}).get("sex"),
        case_data.get("patient", {}).get("initials")
    ])
    
    if not patient_identified:
        missing.append("patient_identification")
    
    # Criterion 2: Suspect product
    if not case_data.get("drug", {}).get("name"):
        missing.append("drug_name")
    
    # Criterion 3: Adverse event
    if not case_data.get("reaction", {}).get("description"):
        missing.append("reaction")
    
    # Criterion 4: At least one date (flexible)
    has_date = any([
        case_data.get("event_date"),
        case_data.get("drug_start_date"),
        case_data.get("receipt_date"),
        case_data.get("onset_date")
    ])
    
    if not has_date:
        missing.append("date_information")
    
    # Criterion 5: Reporter (automatically satisfied for AI extraction)
    # For AI-extracted cases, we consider the system as the reporter
    
    # Determine completeness status
    if len(missing) == 0:
        completeness_status = "complete"
        is_valid = True
    elif len(missing) <= 2:
        # Minor issues - can be completed with minimal information
        completeness_status = "incomplete"
        is_valid = False
    else:
        # Major issues - needs substantial information
        completeness_status = "pending_review"
        is_valid = False
    
    return is_valid, missing, completeness_status


def generate_validation_message(cases_created: int, cases_incomplete: int, 
                                missing_fields_summary: dict) -> str:
    """
    Generate helpful validation message for users
    
    Args:
        cases_created: Number of complete cases
        cases_incomplete: Number of incomplete cases
        missing_fields_summary: Dict with counts of each missing field type
    
    Returns:
        User-friendly message string
    """
    if cases_created == 0 and cases_incomplete == 0:
        return (
            "No adverse event cases found. "
            "Files should contain patient information, drug names, "
            "and adverse reactions to create valid case reports."
        )
    
    if cases_created > 0 and cases_incomplete == 0:
        return (
            f"Processing complete! {cases_created} valid case(s) created successfully. "
            "All cases meet ICH E2B minimum criteria."
        )
    
    if cases_created == 0 and cases_incomplete > 0:
        # Build helpful message about what's missing
        missing_info = []
        if missing_fields_summary.get("patient_identification", 0) > 0:
            missing_info.append("patient demographics (age/sex)")
        if missing_fields_summary.get("drug_name", 0) > 0:
            missing_info.append("drug names")
        if missing_fields_summary.get("reaction", 0) > 0:
            missing_info.append("adverse reactions")
        if missing_fields_summary.get("date_information", 0) > 0:
            missing_info.append("dates")
        
        missing_str = ", ".join(missing_info)
        
        return (
            f"Found {cases_incomplete} potential case(s) but they need more information. "
            f"Missing: {missing_str}. "
            "Cases have been saved as 'incomplete' for manual review."
        )
    
    # Mixed results
    return (
        f"Processing complete! Created {cases_created} valid case(s). "
        f"{cases_incomplete} case(s) need additional information and are flagged for review."
    )


# ============================================================================
# USAGE EXAMPLE - Add to create_cases_from_entities function
# ============================================================================
"""
Replace your current create_cases_from_entities with this enhanced version:

async def create_cases_from_entities(entities: List[dict], file_id: str) -> dict:
    '''
    Create pv_cases records from extracted entities with ICH E2B validation
    Returns: dict with counts and validation summary
    '''
    case_ids = []
    incomplete_cases = 0
    missing_fields_summary = {}
    
    for entity in entities:
        try:
            # Validate ICH E2B compliance
            is_valid, missing_fields, completeness_status = validate_ich_e2b_compliance(entity)
            
            # Track missing fields for summary
            for field in missing_fields:
                missing_fields_summary[field] = missing_fields_summary.get(field, 0) + 1
            
            # Build case data
            case_data = {
                "drug_name": entity.get("drug", {}).get("name", "Unknown"),
                "reaction": entity.get("reaction", {}).get("description", "Unknown"),
                "age": entity.get("patient", {}).get("age"),
                "sex": entity.get("patient", {}).get("sex"),
                "serious": entity.get("serious", False),
                "source": "AI_EXTRACTED",
                "source_file_id": file_id,
                "narrative": entity.get("narrative", ""),
                "ai_extracted": True,
                "ai_confidence": entity.get("confidence", 0.5),
                
                # NEW: ICH E2B validation fields
                "completeness_status": completeness_status,
                "missing_fields": json.dumps(missing_fields),
                "validation_passed": is_valid,
                "requires_manual_review": not is_valid,
                
                # NEW: Additional ICH E2B fields
                "patient_initials": entity.get("patient", {}).get("initials"),
                "reporter_type": "Other",  # AI extraction
                "drug_start_date": entity.get("drug_start_date"),
                "receipt_date": datetime.now().date().isoformat(),
            }
            
            result = supabase.table("pv_cases").insert(case_data).execute()
            
            if result.data:
                case_ids.append(result.data[0]["id"])
                if not is_valid:
                    incomplete_cases += 1
        
        except Exception as e:
            print(f"Error creating case: {e}")
            continue
    
    return {
        "case_ids": case_ids,
        "valid_cases": len(case_ids) - incomplete_cases,
        "incomplete_cases": incomplete_cases,
        "missing_fields_summary": missing_fields_summary
    }
"""

# ============================================================================
# QUICK TEST
# ============================================================================
if __name__ == "__main__":
    # Test case 1: Complete case
    complete_case = {
        "patient": {"age": 45, "sex": "M"},
        "drug": {"name": "Aspirin"},
        "reaction": {"description": "Stomach pain"},
        "event_date": "2024-01-15"
    }
    
    is_valid, missing, status = validate_ich_e2b_compliance(complete_case)
    print(f"Complete case: valid={is_valid}, status={status}, missing={missing}")
    # Expected: valid=True, status='complete', missing=[]
    
    # Test case 2: Incomplete case (missing patient and date)
    incomplete_case = {
        "drug": {"name": "Lipitor"},
        "reaction": {"description": "Muscle pain"}
    }
    
    is_valid, missing, status = validate_ich_e2b_compliance(incomplete_case)
    print(f"Incomplete case: valid={is_valid}, status={status}, missing={missing}")
    # Expected: valid=False, status='incomplete' or 'pending_review', missing=['patient_identification', 'date_information']
    
    # Test case 3: Validation messages
    msg1 = generate_validation_message(5, 0, {})
    print(f"Message 1: {msg1}")
    
    msg2 = generate_validation_message(3, 2, {"patient_identification": 2, "date_information": 1})
    print(f"Message 2: {msg2}")
    
    msg3 = generate_validation_message(0, 5, {"drug_name": 3, "reaction": 5})
    print(f"Message 3: {msg3}")
