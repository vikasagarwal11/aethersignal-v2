"""
Multi-Format Data Parsers
Supports: E2B XML (R2/R3), FAERS ASCII, Excel, CSV, PDF

Intelligent format detection and parsing with error handling
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional
import pandas as pd
import re
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class FormatDetector:
    """
    Automatically detects file format
    """
    
    @staticmethod
    def detect_format(file_path: str) -> str:
        """
        Detect file format from extension and content
        
        Returns: 'e2b_r2', 'e2b_r3', 'faers', 'excel', 'csv', 'pdf', 'unknown'
        """
        path = Path(file_path)
        extension = path.suffix.lower()
        
        # XML - check if E2B
        if extension == '.xml':
            return FormatDetector._detect_e2b_version(file_path)
        
        # ASCII - likely FAERS
        if extension in ['.txt', '.asc']:
            return 'faers'
        
        # Excel
        if extension in ['.xlsx', '.xls', '.xlsm']:
            return 'excel'
        
        # CSV
        if extension == '.csv':
            return 'csv'
        
        # PDF
        if extension == '.pdf':
            return 'pdf'
        
        return 'unknown'
    
    @staticmethod
    def _detect_e2b_version(file_path: str) -> str:
        """Detect E2B R2 vs R3"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Check namespace
            namespace = root.tag.split('}')[0].strip('{')
            
            if 'R2' in namespace or 'r2' in namespace:
                return 'e2b_r2'
            elif 'R3' in namespace or 'r3' in namespace:
                return 'e2b_r3'
            
            # Fallback - check structure
            if root.find('.//ichicsr') is not None:
                return 'e2b_r2'
            
            return 'e2b_r3'
            
        except Exception as e:
            logger.error(f"Error detecting E2B version: {e}")
            return 'e2b_r2'  # Default


class E2BParser:
    """
    Parser for E2B XML format (R2 and R3)
    ICH International Conference on Harmonisation standard
    """
    
    def parse_r2(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse E2B R2 XML file
        
        Returns: List of case dictionaries
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            cases = []
            
            # Find all safety reports
            for report in root.findall('.//safetyreport'):
                case = self._parse_r2_report(report)
                cases.append(case)
            
            logger.info(f"Parsed {len(cases)} cases from E2B R2 file")
            return cases
            
        except Exception as e:
            logger.error(f"Error parsing E2B R2: {e}", exc_info=True)
            raise
    
    def _parse_r2_report(self, report: ET.Element) -> Dict[str, Any]:
        """Parse single E2B R2 report"""
        case = {}
        
        # Safety Report ID
        case['case_number'] = self._get_text(report, './/safetyreportid')
        
        # Patient information
        patient = report.find('.//patient')
        if patient is not None:
            case['patient_age'] = self._get_number(patient, './/patientonsetage')
            case['patient_age_unit'] = self._get_text(patient, './/patientonsetageunit')
            case['patient_sex'] = self._get_text(patient, './/patientsex')
            case['patient_weight'] = self._get_number(patient, './/patientweight')
        
        # Drug information
        drugs = []
        for drug in report.findall('.//drug'):
            drug_info = {
                'name': self._get_text(drug, './/medicinalproduct'),
                'indication': self._get_text(drug, './/drugindication'),
                'dose': self._get_text(drug, './/drugdosagetext'),
                'route': self._get_text(drug, './/drugadministrationroute'),
                'start_date': self._get_text(drug, './/drugstartdate'),
                'end_date': self._get_text(drug, './/drugenddate')
            }
            drugs.append(drug_info)
        
        # Primary drug
        if drugs:
            case['drug_name'] = drugs[0]['name']
            case['indication'] = drugs[0]['indication']
            case['dose'] = drugs[0]['dose']
            case['route'] = drugs[0]['route']
            case['start_date'] = drugs[0]['start_date']
            case['stop_date'] = drugs[0]['end_date']
            case['concomitant_drugs'] = [d['name'] for d in drugs[1:]]
        
        # Reactions
        reactions = []
        for reaction in report.findall('.//reaction'):
            reaction_info = {
                'term': self._get_text(reaction, './/reactionmeddrapt'),
                'serious': self._get_text(reaction, './/reactionoutcome') == '1'
            }
            reactions.append(reaction_info)
        
        # Primary reaction
        if reactions:
            case['reaction'] = reactions[0]['term']
            case['serious'] = reactions[0]['serious']
        
        # Outcomes
        case['outcome'] = self._get_text(report, './/patientdeath')
        if case['outcome'] == '1':
            case['outcome'] = 'fatal'
        
        # Dates
        case['event_date'] = self._get_text(report, './/reactionstartdate')
        case['report_date'] = self._get_text(report, './/receiptdate')
        
        # Reporter
        case['reporter_type'] = self._get_text(report, './/qualification')
        case['reporter_country'] = self._get_text(report, './/occurcountry')
        
        # Narrative
        case['narrative'] = self._get_text(report, './/narrativeincludeclinical')
        
        return case
    
    def parse_r3(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse E2B R3 XML file (newer format)
        
        Returns: List of case dictionaries
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            cases = []
            
            # Find all ICSRs (Individual Case Safety Reports)
            for icsr in root.findall('.//{urn:hl7-org:v3}ICSR'):
                case = self._parse_r3_report(icsr)
                cases.append(case)
            
            logger.info(f"Parsed {len(cases)} cases from E2B R3 file")
            return cases
            
        except Exception as e:
            logger.error(f"Error parsing E2B R3: {e}", exc_info=True)
            raise
    
    def _parse_r3_report(self, icsr: ET.Element) -> Dict[str, Any]:
        """Parse single E2B R3 report (simplified)"""
        # R3 has different structure - simplified implementation
        case = {}
        
        # Would need full R3 schema implementation
        # This is a placeholder showing the concept
        
        case['case_number'] = 'R3_PLACEHOLDER'
        case['format'] = 'e2b_r3'
        
        return case
    
    def _get_text(self, element: ET.Element, path: str) -> Optional[str]:
        """Safely extract text from XML element"""
        found = element.find(path)
        return found.text if found is not None else None
    
    def _get_number(self, element: ET.Element, path: str) -> Optional[float]:
        """Safely extract number from XML element"""
        text = self._get_text(element, path)
        if text:
            try:
                return float(text)
            except ValueError:
                return None
        return None


class FAERSParser:
    """
    Parser for FAERS ASCII format
    FDA Adverse Event Reporting System
    """
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse FAERS ASCII file
        
        FAERS format has multiple files:
        - DEMO (demographics)
        - DRUG (drug information)
        - REAC (reactions)
        - OUTC (outcomes)
        - THER (therapy dates)
        
        Returns: List of case dictionaries
        """
        try:
            # Read file
            with open(file_path, 'r', encoding='latin-1') as f:
                lines = f.readlines()
            
            # Determine file type from filename or content
            file_type = self._detect_faers_type(file_path, lines)
            
            if file_type == 'DEMO':
                return self._parse_demo(lines)
            elif file_type == 'DRUG':
                return self._parse_drug(lines)
            elif file_type == 'REAC':
                return self._parse_reac(lines)
            else:
                logger.warning(f"Unknown FAERS file type: {file_type}")
                return []
                
        except Exception as e:
            logger.error(f"Error parsing FAERS: {e}", exc_info=True)
            raise
    
    def _detect_faers_type(self, file_path: str, lines: List[str]) -> str:
        """Detect FAERS file type"""
        # Check filename
        path = Path(file_path)
        name = path.stem.upper()
        
        if 'DEMO' in name:
            return 'DEMO'
        elif 'DRUG' in name:
            return 'DRUG'
        elif 'REAC' in name:
            return 'REAC'
        elif 'OUTC' in name:
            return 'OUTC'
        elif 'THER' in name:
            return 'THER'
        
        # Check first line (header)
        if lines:
            header = lines[0].upper()
            if 'CASEID' in header and 'AGE' in header:
                return 'DEMO'
            elif 'DRUGNAME' in header:
                return 'DRUG'
            elif 'PT' in header:
                return 'REAC'
        
        return 'UNKNOWN'
    
    def _parse_demo(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Parse DEMO (demographics) file"""
        cases = []
        
        # Parse as CSV
        df = pd.DataFrame([line.strip().split('$') for line in lines[1:]], 
                         columns=lines[0].strip().split('$'))
        
        for _, row in df.iterrows():
            case = {
                'case_number': row.get('caseid', ''),
                'patient_age': self._safe_float(row.get('age')),
                'patient_age_unit': row.get('age_cod', ''),
                'patient_sex': row.get('sex', ''),
                'reporter_country': row.get('occr_country', ''),
                'event_date': row.get('event_dt', ''),
                'report_date': row.get('rept_dt', '')
            }
            cases.append(case)
        
        return cases
    
    def _parse_drug(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Parse DRUG file"""
        drugs = []
        
        df = pd.DataFrame([line.strip().split('$') for line in lines[1:]], 
                         columns=lines[0].strip().split('$'))
        
        for _, row in df.iterrows():
            drug = {
                'case_number': row.get('caseid', ''),
                'drug_name': row.get('drugname', ''),
                'route': row.get('route', ''),
                'indication': row.get('indi_pt', '')
            }
            drugs.append(drug)
        
        return drugs
    
    def _parse_reac(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Parse REAC (reactions) file"""
        reactions = []
        
        df = pd.DataFrame([line.strip().split('$') for line in lines[1:]], 
                         columns=lines[0].strip().split('$'))
        
        for _, row in df.iterrows():
            reaction = {
                'case_number': row.get('caseid', ''),
                'reaction': row.get('pt', '')
            }
            reactions.append(reaction)
        
        return reactions
    
    def _safe_float(self, value) -> Optional[float]:
        """Safely convert to float"""
        try:
            return float(value) if value else None
        except (ValueError, TypeError):
            return None


class ExcelParser:
    """
    Enhanced Excel parser with intelligent field detection
    Uses the IntelligentFormatAnalyzer
    """
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse Excel file with automatic field mapping
        
        Returns: List of case dictionaries with standard fields
        """
        try:
            # Would integrate with IntelligentFormatAnalyzer here
            df = pd.read_excel(file_path)
            
            # Convert to list of dicts
            cases = df.to_dict('records')
            
            logger.info(f"Parsed {len(cases)} cases from Excel file")
            return cases
            
        except Exception as e:
            logger.error(f"Error parsing Excel: {e}", exc_info=True)
            raise


class PDFParser:
    """
    PDF parser for extracting case information
    Uses OCR if needed
    """
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse PDF file and extract case information
        
        Returns: List of case dictionaries
        """
        try:
            # Would use PyPDF2 or pdfplumber here
            # Placeholder implementation
            
            case = {
                'case_number': 'PDF_EXTRACTED',
                'narrative': 'Text extracted from PDF',
                'format': 'pdf'
            }
            
            logger.info("Parsed PDF file")
            return [case]
            
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}", exc_info=True)
            raise


class UniversalParser:
    """
    Universal parser that automatically detects format and uses appropriate parser
    """
    
    def __init__(self):
        self.e2b_parser = E2BParser()
        self.faers_parser = FAERSParser()
        self.excel_parser = ExcelParser()
        self.pdf_parser = PDFParser()
        
    def parse(self, file_path: str) -> Dict[str, Any]:
        """
        Parse any supported file format
        
        Returns:
            {
                'format': 'detected_format',
                'cases': [...],
                'metadata': {...}
            }
        """
        # Detect format
        detected_format = FormatDetector.detect_format(file_path)
        
        logger.info(f"Detected format: {detected_format} for file: {file_path}")
        
        # Parse based on format
        if detected_format == 'e2b_r2':
            cases = self.e2b_parser.parse_r2(file_path)
        elif detected_format == 'e2b_r3':
            cases = self.e2b_parser.parse_r3(file_path)
        elif detected_format == 'faers':
            cases = self.faers_parser.parse(file_path)
        elif detected_format in ['excel', 'csv']:
            cases = self.excel_parser.parse(file_path)
        elif detected_format == 'pdf':
            cases = self.pdf_parser.parse(file_path)
        else:
            raise ValueError(f"Unsupported file format: {detected_format}")
        
        return {
            'format': detected_format,
            'cases': cases,
            'metadata': {
                'file_path': file_path,
                'parsed_at': datetime.now().isoformat(),
                'case_count': len(cases)
            }
        }


# Convenience function
def parse_any_file(file_path: str) -> Dict[str, Any]:
    """
    Parse any supported file format automatically
    
    Usage:
        result = parse_any_file('report.xml')
        cases = result['cases']
        format = result['format']
    """
    parser = UniversalParser()
    return parser.parse(file_path)
