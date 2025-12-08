"""
AI Query Engine
Processes natural language queries and returns structured responses
Powers the conversational AI interface
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from supabase import create_client, Client
import json
import re

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Anthropic client
anthropic_client = None
try:
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_api_key:
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
except:
    pass


class QueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    data: Optional[Dict[str, Any]] = None
    visualization: Optional[str] = None
    sql_query: Optional[str] = None
    follow_up_suggestions: List[str] = []
    intent: Optional[str] = None


def detect_query_intent(query: str) -> tuple[str, Dict[str, Any]]:
    """
    Detect the intent of the natural language query
    Returns: (intent_type, extracted_parameters)
    """
    query_lower = query.lower()
    
    # Count queries
    if any(word in query_lower for word in ["how many", "count", "number of", "total"]):
        # Extract entity
        if "serious" in query_lower and "event" in query_lower:
            return ("count_serious", {})
        elif "case" in query_lower:
            return ("count_cases", {})
        elif any(word in query_lower for word in ["drug", "medication"]):
            # Extract drug name if specified
            match = re.search(r"for ([a-z]+)", query_lower)
            drug = match.group(1) if match else None
            return ("count_drugs", {"drug": drug})
        elif "event" in query_lower or "ae" in query_lower or "adverse" in query_lower:
            return ("count_events", {})
    
    # Show/List queries
    if any(word in query_lower for word in ["show", "list", "display", "find"]):
        # Extract drug name
        match = re.search(r"(?:for|about|with) ([a-z\s]+)(?:$| )", query_lower)
        entity = match.group(1).strip() if match else None
        
        if "adverse event" in query_lower or "ae" in query_lower:
            return ("list_events", {"drug": entity})
        elif "drug" in query_lower:
            return ("list_drugs", {})
        elif "case" in query_lower:
            return ("list_cases", {"drug": entity})
    
    # Existence queries
    if any(word in query_lower for word in ["are there", "is there", "any", "exist"]):
        # Extract drug name
        match = re.search(r"(?:for|of|about) ([a-z\s]+)", query_lower)
        drug = match.group(1).strip() if match else None
        return ("check_existence", {"drug": drug})
    
    # Trend queries
    if any(word in query_lower for word in ["trend", "trending", "pattern", "over time"]):
        match = re.search(r"(?:for|of) ([a-z\s]+)", query_lower)
        entity = match.group(1).strip() if match else None
        return ("analyze_trend", {"entity": entity})
    
    # Comparison queries
    if any(word in query_lower for word in ["compare", "versus", "vs", "difference"]):
        return ("compare", {})
    
    # General question
    return ("general", {})


async def execute_count_query(intent: str, params: Dict[str, Any]) -> QueryResponse:
    """Execute counting queries"""
    try:
        if intent == "count_serious":
            result = supabase.table("pv_cases").select("id", count="exact").eq("serious", True).execute()
            count = result.count if hasattr(result, 'count') else len(result.data or [])
            
            total_result = supabase.table("pv_cases").select("id", count="exact").execute()
            total = total_result.count if hasattr(total_result, 'count') else len(total_result.data or [])
            
            percentage = round((count / total * 100) if total > 0 else 0, 1)
            
            return QueryResponse(
                answer=f"There are **{count} serious events** out of {total} total cases ({percentage}%).",
                data={"serious": count, "total": total, "percentage": percentage},
                visualization="pie_chart",
                follow_up_suggestions=[
                    "Which drugs have the most serious events?",
                    "Show me the breakdown by severity",
                    "What types of serious events are most common?"
                ],
                intent=intent
            )
        
        elif intent == "count_cases":
            result = supabase.table("pv_cases").select("id", count="exact").execute()
            count = result.count if hasattr(result, 'count') else len(result.data or [])
            
            return QueryResponse(
                answer=f"You have **{count} cases** in your database.",
                data={"total_cases": count},
                follow_up_suggestions=[
                    "How many are serious events?",
                    "Show me cases by drug",
                    "What's the trend over time?"
                ],
                intent=intent
            )
        
        elif intent == "count_drugs":
            drug = params.get("drug")
            if drug:
                result = supabase.table("pv_cases").select("id", count="exact").ilike("drug_name", f"%{drug}%").execute()
                count = result.count if hasattr(result, 'count') else len(result.data or [])
                
                return QueryResponse(
                    answer=f"Found **{count} adverse events** for **{drug.title()}**.",
                    data={"drug": drug, "count": count},
                    visualization="table",
                    follow_up_suggestions=[
                        f"Show me all {drug} cases",
                        f"What reactions are reported for {drug}?",
                        f"How many {drug} cases are serious?"
                    ],
                    intent=intent
                )
            else:
                result = supabase.table("pv_cases").select("drug_name").execute()
                unique_drugs = len(set(c.get("drug_name") for c in (result.data or []) if c.get("drug_name")))
                
                return QueryResponse(
                    answer=f"You have **{unique_drugs} unique drugs** in your database.",
                    data={"unique_drugs": unique_drugs},
                    follow_up_suggestions=[
                        "Show me the top drugs by case count",
                        "Which drug has the most serious events?",
                        "List all drugs"
                    ],
                    intent=intent
                )
        
        elif intent == "count_events":
            result = supabase.table("pv_cases").select("reaction").execute()
            unique_reactions = len(set(c.get("reaction") for c in (result.data or []) if c.get("reaction")))
            total = len(result.data or [])
            
            return QueryResponse(
                answer=f"You have **{total} total adverse events** representing **{unique_reactions} unique reactions**.",
                data={"total_events": total, "unique_reactions": unique_reactions},
                visualization="bar_chart",
                follow_up_suggestions=[
                    "What are the most common reactions?",
                    "Show me serious adverse events only",
                    "Break down by drug"
                ],
                intent=intent
            )
    
    except Exception as e:
        print(f"Error in count query: {e}")
        return QueryResponse(
            answer=f"Sorry, I encountered an error: {str(e)}",
            intent=intent
        )


async def execute_list_query(intent: str, params: Dict[str, Any]) -> QueryResponse:
    """Execute listing/show queries"""
    try:
        if intent == "list_events":
            drug = params.get("drug")
            if drug:
                result = supabase.table("pv_cases").select(
                    "id, drug_name, reaction, serious, created_at"
                ).ilike("drug_name", f"%{drug}%").limit(20).execute()
                
                cases = result.data or []
                
                if not cases:
                    return QueryResponse(
                        answer=f"No adverse events found for **{drug.title()}**. Would you like me to search the FAERS database?",
                        data={"drug": drug, "count": 0},
                        follow_up_suggestions=[
                            "Search FAERS for this drug",
                            "Show me all drugs in the database",
                            "What cases do I have?"
                        ],
                        intent=intent
                    )
                
                # Group by reaction
                reaction_counts = {}
                for case in cases:
                    reaction = case.get("reaction", "Unknown")
                    if reaction not in reaction_counts:
                        reaction_counts[reaction] = {"count": 0, "serious": 0}
                    reaction_counts[reaction]["count"] += 1
                    if case.get("serious"):
                        reaction_counts[reaction]["serious"] += 1
                
                summary = "\n".join([
                    f"- **{reaction}**: {data['count']} case(s)" + 
                    (f" ({data['serious']} serious)" if data['serious'] > 0 else "")
                    for reaction, data in sorted(
                        reaction_counts.items(),
                        key=lambda x: x[1]['count'],
                        reverse=True
                    )
                ])
                
                return QueryResponse(
                    answer=f"Found **{len(cases)} adverse events** for **{drug.title()}**:\n\n{summary}",
                    data={
                        "drug": drug,
                        "total_cases": len(cases),
                        "reactions": reaction_counts,
                        "cases": cases[:10]  # Return top 10 for display
                    },
                    visualization="table",
                    follow_up_suggestions=[
                        f"Show me only serious {drug} events",
                        f"What's the trend for {drug}?",
                        "Compare with other drugs"
                    ],
                    intent=intent
                )
        
        elif intent == "list_drugs":
            result = supabase.table("pv_cases").select("drug_name, serious").execute()
            cases = result.data or []
            
            # Count by drug
            drug_counts = {}
            for case in cases:
                drug = case.get("drug_name", "Unknown")
                if drug not in drug_counts:
                    drug_counts[drug] = {"count": 0, "serious": 0}
                drug_counts[drug]["count"] += 1
                if case.get("serious"):
                    drug_counts[drug]["serious"] += 1
            
            top_drugs = sorted(drug_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:10]
            
            summary = "\n".join([
                f"{i+1}. **{drug}**: {data['count']} case(s)" +
                (f" ({data['serious']} serious)" if data['serious'] > 0 else "")
                for i, (drug, data) in enumerate(top_drugs)
            ])
            
            return QueryResponse(
                answer=f"**Top 10 drugs by case count:**\n\n{summary}",
                data={"drugs": dict(top_drugs), "total_unique": len(drug_counts)},
                visualization="bar_chart",
                follow_up_suggestions=[
                    "Show me all Aspirin cases",
                    "Which drug has most serious events?",
                    "Compare top 3 drugs"
                ],
                intent=intent
            )
    
    except Exception as e:
        print(f"Error in list query: {e}")
        return QueryResponse(
            answer=f"Sorry, I encountered an error: {str(e)}",
            intent=intent
        )


async def execute_existence_query(intent: str, params: Dict[str, Any]) -> QueryResponse:
    """Check if something exists"""
    drug = params.get("drug")
    if not drug:
        return QueryResponse(
            answer="Please specify a drug name. For example: 'Are there any AE for Aspirin?'",
            intent=intent
        )
    
    try:
        result = supabase.table("pv_cases").select("id", count="exact").ilike("drug_name", f"%{drug}%").execute()
        count = result.count if hasattr(result, 'count') else len(result.data or [])
        
        if count > 0:
            return QueryResponse(
                answer=f"Yes, there are **{count} adverse events** for **{drug.title()}** in your database.",
                data={"drug": drug, "count": count, "exists": True},
                follow_up_suggestions=[
                    f"Show me all {drug} cases",
                    f"How many are serious?",
                    f"What reactions are reported?"
                ],
                intent=intent
            )
        else:
            return QueryResponse(
                answer=f"No adverse events found for **{drug.title()}** in your current dataset. Would you like me to search the FAERS database?",
                data={"drug": drug, "count": 0, "exists": False},
                follow_up_suggestions=[
                    "Search FAERS database",
                    "Show me what drugs I have",
                    "Upload more data"
                ],
                intent=intent
            )
    
    except Exception as e:
        return QueryResponse(
            answer=f"Error checking for {drug}: {str(e)}",
            intent=intent
        )


@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process natural language query and return intelligent response
    
    Examples:
    - "How many serious events?"
    - "Show me Aspirin adverse events"
    - "Are there any AE for drug XYZ?"
    - "What's trending?"
    """
    try:
        query = request.query.strip()
        
        # Detect intent
        intent, params = detect_query_intent(query)
        
        print(f"[AI Query] Query: {query}")
        print(f"[AI Query] Intent: {intent}, Params: {params}")
        
        # Route to appropriate handler
        if intent.startswith("count_"):
            return await execute_count_query(intent, params)
        
        elif intent.startswith("list_"):
            return await execute_list_query(intent, params)
        
        elif intent == "check_existence":
            return await execute_existence_query(intent, params)
        
        elif intent == "analyze_trend":
            # TODO: Implement trend analysis
            return QueryResponse(
                answer="Trend analysis coming soon! For now, try asking about specific drugs or events.",
                intent=intent,
                follow_up_suggestions=[
                    "How many cases do I have?",
                    "Show me top drugs",
                    "What are the most common reactions?"
                ]
            )
        
        else:
            # General query - use Claude AI if available
            if anthropic_client:
                # Get context data
                stats_result = supabase.table("pv_cases").select("id, drug_name, reaction, serious", count="exact").execute()
                total_cases = stats_result.count if hasattr(stats_result, 'count') else len(stats_result.data or [])
                
                prompt = f"""You are an AI assistant for a pharmacovigilance platform.
                
Current database stats:
- Total cases: {total_cases}

User query: {query}

Provide a helpful, concise response. If you need specific data, suggest a more specific query."""

                message = anthropic_client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                answer = message.content[0].text
                
                return QueryResponse(
                    answer=answer,
                    intent="general",
                    follow_up_suggestions=[
                        "How many cases do I have?",
                        "Show me serious events",
                        "List top drugs"
                    ]
                )
            else:
                return QueryResponse(
                    answer="I can help you analyze your pharmacovigilance data. Try asking:\n- 'How many serious events?'\n- 'Show me Aspirin cases'\n- 'What drugs do I have?'",
                    intent="general",
                    follow_up_suggestions=[
                        "How many cases?",
                        "Show me serious events",
                        "List all drugs"
                    ]
                )
    
    except Exception as e:
        print(f"Error processing query: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_query_suggestions():
    """Get suggested queries based on current data"""
    try:
        # Get some basic stats to generate relevant suggestions
        result = supabase.table("pv_cases").select("drug_name", count="exact").limit(5).execute()
        
        top_drugs = []
        if result.data:
            drug_counts = {}
            for case in result.data:
                drug = case.get("drug_name")
                if drug:
                    drug_counts[drug] = drug_counts.get(drug, 0) + 1
            top_drugs = sorted(drug_counts.keys(), key=lambda x: drug_counts[x], reverse=True)[:3]
        
        suggestions = [
            "How many serious events do I have?",
            "Show me all adverse events",
            "What are the top drugs by case count?",
            "List all reactions"
        ]
        
        # Add drug-specific suggestions
        for drug in top_drugs[:2]:
            suggestions.append(f"Show me {drug} adverse events")
        
        return {"suggestions": suggestions}
    
    except:
        return {
            "suggestions": [
                "How many cases do I have?",
                "Show me serious events",
                "List all drugs"
            ]
        }

