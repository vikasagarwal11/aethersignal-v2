"""
SNOMED CT Loader
================
Loads SNOMED CT RF2 files into SQLite database for efficient terminology mapping.

Usage:
    python backend/scripts/load_snomed_ct.py \
        --snomed_dir path/to/extracted/snomed \
        --db_path data/snomed_ct.db

One-time operation: ~10-15 minutes for full load.
"""

import sqlite3
import csv
import sys
import argparse
from pathlib import Path
from typing import Optional
import logging
from datetime import datetime

# Increase CSV field size limit to handle large SNOMED CT fields
csv.field_size_limit(sys.maxsize)

logger = logging.getLogger(__name__)


def create_tables(cursor: sqlite3.Cursor):
    """Create SNOMED CT tables."""
    logger.info("Creating SNOMED CT tables...")
    
    # Concepts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS snomed_concepts (
            concept_id BIGINT PRIMARY KEY,
            effective_time TEXT,
            active INTEGER,
            module_id BIGINT,
            definition_status_id BIGINT
        )
    """)
    
    # Descriptions table (MOST IMPORTANT for terminology mapping)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS snomed_descriptions (
            description_id BIGINT PRIMARY KEY,
            effective_time TEXT,
            active INTEGER,
            module_id BIGINT,
            concept_id BIGINT,
            language_code TEXT,
            type_id BIGINT,
            term TEXT,
            case_significance_id BIGINT
        )
    """)
    
    # Relationships table (for semantic disambiguation)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS snomed_relationships (
            relationship_id BIGINT PRIMARY KEY,
            effective_time TEXT,
            active INTEGER,
            module_id BIGINT,
            source_id BIGINT,
            destination_id BIGINT,
            relationship_group INTEGER,
            type_id BIGINT,
            characteristic_type_id BIGINT,
            modifier_id BIGINT
        )
    """)
    
    logger.info("✅ Tables created")


def create_indexes(cursor: sqlite3.Cursor):
    """Create indexes for fast lookups."""
    logger.info("Creating indexes...")
    
    # Concepts indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_concepts_active 
        ON snomed_concepts(active) WHERE active = 1
    """)
    
    # Descriptions indexes (CRITICAL for fast term lookups)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_desc_term_lower 
        ON snomed_descriptions(LOWER(term))
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_desc_concept_id 
        ON snomed_descriptions(concept_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_desc_active 
        ON snomed_descriptions(active) WHERE active = 1
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_desc_type 
        ON snomed_descriptions(type_id)
    """)
    
    # Relationships indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_rel_source 
        ON snomed_relationships(source_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_rel_destination 
        ON snomed_relationships(destination_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_rel_type 
        ON snomed_relationships(type_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_rel_active 
        ON snomed_relationships(active) WHERE active = 1
    """)
    
    logger.info("✅ Indexes created")


def load_concepts(cursor: sqlite3.Cursor, concepts_file: Path):
    """Load concepts from RF2 file."""
    if not concepts_file.exists():
        logger.warning(f"Concepts file not found: {concepts_file}")
        return
    
    logger.info(f"Loading concepts from {concepts_file.name}...")
    
    count = 0
    with open(concepts_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header if present
        
        for row in reader:
            if len(row) < 5:
                continue
            
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO snomed_concepts 
                    (concept_id, effective_time, active, module_id, definition_status_id)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    int(row[0]),  # concept_id
                    row[1],       # effective_time
                    int(row[2]),  # active
                    int(row[3]),  # module_id
                    int(row[4]),  # definition_status_id
                ))
                count += 1
                
                if count % 50000 == 0:
                    logger.info(f"  Loaded {count:,} concepts...")
                    cursor.connection.commit()
            except (ValueError, IndexError) as e:
                logger.debug(f"Skipping invalid row: {e}")
                continue
    
    cursor.connection.commit()
    logger.info(f"✅ Loaded {count:,} concepts")


def load_descriptions(cursor: sqlite3.Cursor, descriptions_file: Path):
    """Load descriptions from RF2 file."""
    if not descriptions_file.exists():
        logger.warning(f"Descriptions file not found: {descriptions_file}")
        return
    
    logger.info(f"Loading descriptions from {descriptions_file.name}...")
    
    count = 0
    with open(descriptions_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header if present
        
        for row in reader:
            if len(row) < 9:
                continue
            
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO snomed_descriptions 
                    (description_id, effective_time, active, module_id, concept_id, 
                     language_code, type_id, term, case_significance_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    int(row[0]),  # description_id
                    row[1],       # effective_time
                    int(row[2]),  # active
                    int(row[3]),  # module_id
                    int(row[4]),  # concept_id
                    row[5],       # language_code
                    int(row[6]),  # type_id
                    row[7],       # term
                    int(row[8]),  # case_significance_id
                ))
                count += 1
                
                if count % 100000 == 0:
                    logger.info(f"  Loaded {count:,} descriptions...")
                    cursor.connection.commit()
            except (ValueError, IndexError) as e:
                logger.debug(f"Skipping invalid row: {e}")
                continue
    
    cursor.connection.commit()
    logger.info(f"✅ Loaded {count:,} descriptions")


def load_relationships(cursor: sqlite3.Cursor, relationships_file: Path):
    """Load relationships from RF2 file."""
    if not relationships_file.exists():
        logger.warning(f"Relationships file not found: {relationships_file}")
        return
    
    logger.info(f"Loading relationships from {relationships_file.name}...")
    
    count = 0
    with open(relationships_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header if present
        
        for row in reader:
            if len(row) < 10:
                continue
            
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO snomed_relationships 
                    (relationship_id, effective_time, active, module_id, source_id, 
                     destination_id, relationship_group, type_id, characteristic_type_id, modifier_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    int(row[0]),  # relationship_id
                    row[1],       # effective_time
                    int(row[2]),  # active
                    int(row[3]),  # module_id
                    int(row[4]),  # source_id
                    int(row[5]),  # destination_id
                    int(row[6]),  # relationship_group
                    int(row[7]),  # type_id
                    int(row[8]),  # characteristic_type_id
                    int(row[9]),  # modifier_id
                ))
                count += 1
                
                if count % 100000 == 0:
                    logger.info(f"  Loaded {count:,} relationships...")
                    cursor.connection.commit()
            except (ValueError, IndexError) as e:
                logger.debug(f"Skipping invalid row: {e}")
                continue
    
    cursor.connection.commit()
    logger.info(f"✅ Loaded {count:,} relationships")


def load_snomed_ct(snomed_dir: str, db_path: str = "data/snomed_ct.db"):
    """
    Load SNOMED CT RF2 files into SQLite database.
    
    Args:
        snomed_dir: Directory containing extracted SNOMED CT files
        db_path: Path to SQLite database file
    """
    snomed_path = Path(snomed_dir)
    db_file = Path(db_path)
    
    # Ensure data directory exists
    db_file.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Loading SNOMED CT from {snomed_dir} to {db_path}")
    logger.info(f"Database will be created at: {db_file.absolute()}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create tables
        create_tables(cursor)
        
        # Find RF2 files (look for snapshot files)
        concepts_file = None
        descriptions_file = None
        relationships_file = None
        
        # Search for files
        for file in snomed_path.rglob("sct2_Concept_Snapshot*.txt"):
            concepts_file = file
            break
        
        for file in snomed_path.rglob("sct2_Description_Snapshot*.txt"):
            descriptions_file = file
            break
        
        for file in snomed_path.rglob("sct2_Relationship_Snapshot*.txt"):
            relationships_file = file
            break
        
        if not concepts_file:
            logger.error("❌ Concepts file not found! Looking for: sct2_Concept_Snapshot*.txt")
        if not descriptions_file:
            logger.error("❌ Descriptions file not found! Looking for: sct2_Description_Snapshot*.txt")
        if not relationships_file:
            logger.error("❌ Relationships file not found! Looking for: sct2_Relationship_Snapshot*.txt")
        
        if not all([concepts_file, descriptions_file, relationships_file]):
            raise FileNotFoundError("Required SNOMED CT files not found!")
        
        # Load files
        start_time = datetime.now()
        
        load_concepts(cursor, concepts_file)
        load_descriptions(cursor, descriptions_file)
        load_relationships(cursor, relationships_file)
        
        # Create indexes (after loading data - faster)
        create_indexes(cursor)
        
        # Get final stats
        cursor.execute("SELECT COUNT(*) FROM snomed_concepts WHERE active = 1")
        concept_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM snomed_descriptions WHERE active = 1")
        desc_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM snomed_relationships WHERE active = 1")
        rel_count = cursor.fetchone()[0]
        
        elapsed = datetime.now() - start_time
        
        logger.info("=" * 60)
        logger.info("✅ SNOMED CT LOAD COMPLETE!")
        logger.info(f"   Concepts: {concept_count:,}")
        logger.info(f"   Descriptions: {desc_count:,}")
        logger.info(f"   Relationships: {rel_count:,}")
        logger.info(f"   Time: {elapsed}")
        logger.info(f"   Database: {db_file.absolute()}")
        logger.info("=" * 60)
        
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load SNOMED CT RF2 files into SQLite database")
    parser.add_argument(
        "--snomed_dir",
        type=str,
        required=True,
        help="Directory containing extracted SNOMED CT RF2 files"
    )
    parser.add_argument(
        "--db_path",
        type=str,
        default="data/snomed_ct.db",
        help="Path to SQLite database file (default: data/snomed_ct.db)"
    )
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    load_snomed_ct(args.snomed_dir, args.db_path)

