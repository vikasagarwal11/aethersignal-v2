"""
Terminology Module
==================

Medical terminology mapping and synonym detection.
Uses FDA Adverse Event Codes and SNOMED CT as free alternatives to MedDRA.
"""

from .fda_mapper import FDATerminologyMapper, MappedTerm
from .snomed_mapper import SNOMEDCTMapper, SNOMEDConcept

__all__ = [
    'FDATerminologyMapper', 
    'MappedTerm',
    'SNOMEDCTMapper',
    'SNOMEDConcept',
]
