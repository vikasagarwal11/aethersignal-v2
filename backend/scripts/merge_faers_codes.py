"""
Merge Multiple FAERS Code Files
================================

Merges multiple FAERS extraction files into a single comprehensive terminology file.
Combines Q2 and Q3 data to get maximum coverage.
"""

import json
from pathlib import Path
from typing import Dict, List
from collections import Counter

def merge_faers_files(
    input_files: List[str],
    output_file: str = "data/fda_adverse_event_codes_merged.json"
) -> Dict:
    """
    Merge multiple FAERS code files into one comprehensive file.
    
    Args:
        input_files: List of paths to FAERS JSON files
        output_file: Output merged file path
    
    Returns:
        Merged dictionary with all Preferred Terms
    """
    print(f"🔄 Merging {len(input_files)} FAERS files...")
    
    all_pts = {}
    total_reports = 0
    sources = []
    
    for file_path in input_files:
        path = Path(file_path)
        if not path.exists():
            print(f"⚠️  Warning: File not found: {file_path}")
            continue
        
        print(f"📖 Reading: {path.name}")
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        metadata = data.get("metadata", {})
        pts = data.get("preferred_terms", {})
        
        sources.append({
            "file": path.name,
            "quarter": metadata.get("quarter", "unknown"),
            "total_pts": metadata.get("total_unique_pts", 0),
            "total_reports": metadata.get("total_reports", 0)
        })
        
        total_reports += metadata.get("total_reports", 0)
        
        # Merge Preferred Terms (combine frequencies if duplicate)
        for pt_name, pt_data in pts.items():
            if pt_name in all_pts:
                # Combine frequencies
                all_pts[pt_name]["frequency"] += pt_data["frequency"]
                # Update frequency percent based on combined total
            else:
                all_pts[pt_name] = pt_data.copy()
    
    # Recalculate frequency percentages based on total reports
    print("📊 Recalculating frequency percentages...")
    for pt_name, pt_data in all_pts.items():
        pt_data["frequency_percent"] = round(
            (pt_data["frequency"] / total_reports) * 100, 4
        )
    
    # Sort by frequency (descending)
    sorted_pts = dict(sorted(
        all_pts.items(),
        key=lambda x: x[1]["frequency"],
        reverse=True
    ))
    
    # Create merged output
    merged = {
        "metadata": {
            "source": "FAERS",
            "quarters": [s["quarter"] for s in sources],
            "extraction_date": Path(input_files[0]).stat().st_mtime if input_files else None,
            "total_reports": total_reports,
            "total_unique_pts": len(sorted_pts),
            "source_files": sources
        },
        "preferred_terms": sorted_pts
    }
    
    # Save merged file
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"💾 Saving merged file: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    
    file_size = output_path.stat().st_size / (1024 * 1024)  # MB
    print(f"✅ Merged {len(sorted_pts):,} unique Preferred Terms")
    print(f"   Total Reports: {total_reports:,}")
    print(f"   File Size: {file_size:.2f} MB")
    
    # Show top 10
    print(f"\n📊 Top 10 Most Common Adverse Events (Combined):")
    for i, (pt_name, pt_data) in enumerate(list(sorted_pts.items())[:10], 1):
        freq = pt_data["frequency"]
        pct = pt_data["frequency_percent"]
        print(f"  {i:2d}. {pt_name[:50]:<50} {freq:>8,} ({pct:>5.2f}%)")
    
    return merged


if __name__ == "__main__":
    import sys
    
    # Default files to merge
    input_files = [
        "data/fda_adverse_event_codes.json",  # Q2
        "data/fda_adverse_event_codes_q3.json",  # Q3
    ]
    
    if len(sys.argv) > 1:
        # Use command line arguments
        input_files = sys.argv[1:-1] if len(sys.argv) > 2 else [sys.argv[1]]
        output_file = sys.argv[-1] if len(sys.argv) > 1 else "data/fda_adverse_event_codes_merged.json"
    else:
        output_file = "data/fda_adverse_event_codes_merged.json"
    
    # Filter to only existing files
    existing_files = [f for f in input_files if Path(f).exists()]
    
    if not existing_files:
        print("❌ Error: No input files found!")
        print(f"   Looked for: {input_files}")
        sys.exit(1)
    
    result = merge_faers_files(existing_files, output_file)
    
    if result:
        print("\n🎉 Merge complete!")
        print(f"   Unique PTs: {result['metadata']['total_unique_pts']:,}")
        print(f"   Total Reports: {result['metadata']['total_reports']:,}")
        print(f"   Quarters: {', '.join(result['metadata']['quarters'])}")
    else:
        print("\n❌ Merge failed!")
        sys.exit(1)

