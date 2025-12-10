"""
Extract FDA Adverse Event Codes from FAERS REAC File
====================================================

This script extracts unique Preferred Terms (PTs) from FAERS REAC files
and creates a JSON mapping for use in AetherSignal's NLP parser.
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, Optional
import sys

def extract_faers_codes(
    reac_file: str,
    output_file: str = "data/fda_adverse_event_codes.json"
) -> Optional[Dict]:
    """
    Extract unique adverse event codes from FAERS REAC file.
    
    Args:
        reac_file: Path to REAC*.txt file (e.g., REAC25Q2.txt)
        output_file: Output JSON file path
    
    Returns:
        Dictionary with extracted codes or None if error
    """
    print(f"📦 Extracting FAERS codes from: {reac_file}")
    
    reac_path = Path(reac_file)
    if not reac_path.exists():
        print(f"❌ Error: File not found: {reac_file}")
        return None
    
    try:
        # FAERS files use '$' as delimiter and Latin-1 encoding
        print("📖 Reading file (this may take a minute for large files)...")
        df = pd.read_csv(
            reac_file,
            sep='$',
            low_memory=False,
            encoding='latin-1',
            dtype=str  # Read all as strings to avoid type issues
        )
        
        print(f"✅ Loaded {len(df):,} rows")
        print(f"📋 Columns: {', '.join(df.columns[:10])}...")
        
        # Check for PT column (Preferred Term) - handle both uppercase and lowercase
        pt_column = None
        for col in df.columns:
            if col.upper() == 'PT':
                pt_column = col
                break
        
        if pt_column is None:
            print(f"❌ Error: 'PT' column not found!")
            print(f"Available columns: {', '.join(df.columns)}")
            return None
        
        print(f"✅ Using column: '{pt_column}' for Preferred Terms")
        
        # Extract unique Preferred Terms
        print("🔍 Extracting unique Preferred Terms...")
        pt_counts = df[pt_column].value_counts()
        unique_pts = df[pt_column].dropna().unique()
        
        print(f"✅ Found {len(unique_pts):,} unique Preferred Terms")
        
        # Show top 10 most common
        print(f"\n📊 Top 10 Most Common Adverse Events:")
        for i, (pt, count) in enumerate(pt_counts.head(10).items(), 1):
            pct = (count / len(df)) * 100
            print(f"  {i:2d}. {pt[:50]:<50} {count:>8,} ({pct:>5.2f}%)")
        
        # Create mapping dictionary
        codes = {
            "metadata": {
                "source": "FAERS",
                "quarter": "2025Q2",
                "extraction_date": pd.Timestamp.now().isoformat(),
                "total_reports": int(len(df)),
                "total_unique_pts": int(len(unique_pts))
            },
            "preferred_terms": {}
        }
        
        # Store each PT with its frequency
        print("💾 Building code dictionary...")
        for pt in unique_pts:
            count = int(pt_counts.get(pt, 0))
            codes["preferred_terms"][pt] = {
                "name": pt,
                "frequency": count,
                "frequency_percent": round((count / len(df)) * 100, 4)
            }
        
        # Save to JSON
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"💾 Saving to: {output_path}")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(codes, f, indent=2, ensure_ascii=False)
        
        file_size = output_path.stat().st_size / (1024 * 1024)  # MB
        print(f"✅ Saved {len(unique_pts):,} PTs to {output_path}")
        print(f"   File size: {file_size:.2f} MB")
        
        return codes
        
    except Exception as e:
        print(f"❌ Error processing file: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Default paths (update these to match your file locations)
    if len(sys.argv) > 1:
        reac_file = sys.argv[1]
    else:
        # Try common locations (NOT in backup folder - backup is read-only)
        possible_paths = [
            r"C:\Users\vikas\Downloads\faers_ascii_2025Q2\ASCII\REAC25Q2.txt",
            r"faers_data\ASCII\REAC25Q2.txt",
            # Note: backup folder is read-only, do not use for extraction
        ]
        
        reac_file = None
        for path in possible_paths:
            if Path(path).exists():
                reac_file = path
                break
        
        if not reac_file:
            print("❌ Error: REAC file not found!")
            print("\nUsage: python extract_faers_codes.py <path_to_REAC_file.txt>")
            print("\nOr extract faers_ascii_2025Q2.zip and update the path in this script.")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = "data/fda_adverse_event_codes.json"
    
    result = extract_faers_codes(reac_file, output_file)
    
    if result:
        print("\n🎉 Extraction complete!")
        print(f"   Total PTs: {result['metadata']['total_unique_pts']:,}")
        print(f"   Total Reports: {result['metadata']['total_reports']:,}")
    else:
        print("\n❌ Extraction failed!")
        sys.exit(1)

