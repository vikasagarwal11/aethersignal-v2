import React, { useState, useEffect } from 'react';
import { X, User, Calendar, AlertTriangle, FileText, Download, ExternalLink, Clock, TrendingUp } from 'lucide-react';

interface Case {
  id: string;
  case_number: string;
  patient_age?: number;
  patient_sex?: string;
  patient_weight?: number;
  drug_name: string;
  reaction: string;
  serious: boolean;
  outcome?: string;
  event_date?: string;
  report_date?: string;
  reporter_type?: string;
  narrative?: string;
  indication?: string;
  dose?: string;
  route?: string;
  duration?: string;
  start_date?: string;
  stop_date?: string;
  reporter_country?: string;
  concomitant_drugs?: string[];
  medical_history?: string;
  lab_data?: any;
  created_at: string;
}

interface RelatedCase {
  id: string;
  case_number: string;
  drug_name: string;
  reaction: string;
  similarity_score: number;
  patient_age?: number;
  patient_sex?: string;
  serious: boolean;
}

interface CaseDetailModalProps {
  caseId: string;
  drugName?: string;
  eventName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CaseDetailModal({ caseId, drugName, eventName, isOpen, onClose }: CaseDetailModalProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'related' | 'export'>('overview');

  useEffect(() => {
    if (isOpen && (caseId || (drugName && eventName))) {
      const abortController = new AbortController();
      
      const fetchCaseDetails = async () => {
        setIsLoading(true);
        try {
          // Fetch case details
          let url = '';
          if (caseId) {
            url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/cases/${caseId}`;
          } else if (drugName && eventName) {
            url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/cases/by-drug-event?drug=${encodeURIComponent(drugName)}&event=${encodeURIComponent(eventName)}`;
          }

          const response = await fetch(url, { signal: abortController.signal });
          if (!response.ok) throw new Error('Failed to fetch case');
          
          const data = await response.json();
          setCaseData(Array.isArray(data) ? data[0] : data);

          // Fetch related cases
          if (data && data.id) {
            const relatedResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/cases/${data.id}/similar?limit=5`,
              { signal: abortController.signal }
            );
            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();
              setRelatedCases(relatedData);
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching case details:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchCaseDetails();

      return () => {
        abortController.abort();
      };
    }
  }, [isOpen, caseId, drugName, eventName]);

  const handleExport = async (format: 'pdf' | 'word') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/cases/${caseData?.id}/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case_${caseData?.case_number}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting case:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeriousnessLabel = (serious: boolean) => {
    return serious ? (
      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
        SERIOUS
      </span>
    ) : (
      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
        NON-SERIOUS
      </span>
    );
  };

  const getOutcomeColor = (outcome?: string) => {
    const colors: Record<string, string> = {
      'recovered': 'text-green-400',
      'recovering': 'text-blue-400',
      'not recovered': 'text-orange-400',
      'fatal': 'text-red-400',
      'unknown': 'text-slate-400'
    };
    return colors[outcome?.toLowerCase() || 'unknown'] || 'text-slate-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">
              Case Details
              {caseData && (
                <span className="ml-3 text-lg font-normal text-slate-400">
                  #{caseData.case_number}
                </span>
              )}
            </h2>
            {caseData && (
              <p className="text-sm text-slate-400 mt-1">
                {caseData.drug_name} + {caseData.reaction}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'related', label: 'Related Cases', icon: TrendingUp },
            { id: 'export', label: 'Export', icon: Download }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Loading case details...</p>
            </div>
          ) : !caseData ? (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>Case not found</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Patient Information */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Age</div>
                        <div className="text-slate-200 font-medium">
                          {caseData.patient_age || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Sex</div>
                        <div className="text-slate-200 font-medium">
                          {caseData.patient_sex || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Weight</div>
                        <div className="text-slate-200 font-medium">
                          {caseData.patient_weight ? `${caseData.patient_weight} kg` : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Country</div>
                        <div className="text-slate-200 font-medium">
                          {caseData.reporter_country || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drug & Event Information */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">
                      Drug & Event Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Drug Name</div>
                          <div className="text-slate-200 font-semibold text-lg">
                            {caseData.drug_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Reaction</div>
                          <div className="text-slate-200 font-semibold text-lg">
                            {caseData.reaction}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Indication</div>
                          <div className="text-slate-200">
                            {caseData.indication || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Dose</div>
                          <div className="text-slate-200">
                            {caseData.dose || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Route</div>
                          <div className="text-slate-200">
                            {caseData.route || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Duration</div>
                          <div className="text-slate-200">
                            {caseData.duration || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Seriousness</div>
                          {getSeriousnessLabel(caseData.serious)}
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Outcome</div>
                          <div className={`font-semibold ${getOutcomeColor(caseData.outcome)}`}>
                            {caseData.outcome || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Important Dates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Start Date</div>
                        <div className="text-slate-200">{formatDate(caseData.start_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Event Date</div>
                        <div className="text-slate-200">{formatDate(caseData.event_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Stop Date</div>
                        <div className="text-slate-200">{formatDate(caseData.stop_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Report Date</div>
                        <div className="text-slate-200">{formatDate(caseData.report_date)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Narrative */}
                  {caseData.narrative && (
                    <div className="bg-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-200 mb-4">
                        Case Narrative
                      </h3>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {caseData.narrative}
                      </div>
                    </div>
                  )}

                  {/* Concomitant Drugs */}
                  {caseData.concomitant_drugs && caseData.concomitant_drugs.length > 0 && (
                    <div className="bg-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-200 mb-4">
                        Concomitant Medications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {caseData.concomitant_drugs.map((drug, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                          >
                            {drug}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical History */}
                  {caseData.medical_history && (
                    <div className="bg-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-200 mb-4">
                        Medical History
                      </h3>
                      <div className="text-slate-300 whitespace-pre-wrap">
                        {caseData.medical_history}
                      </div>
                    </div>
                  )}

                  {/* Reporter Information */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">
                      Reporter Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Reporter Type</div>
                        <div className="text-slate-200">
                          {caseData.reporter_type || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Report Created</div>
                        <div className="text-slate-200">
                          {formatDate(caseData.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Case Timeline
                  </h3>
                  <div className="relative pl-8">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700" />

                    {/* Timeline events */}
                    {[
                      { date: caseData.start_date, label: 'Drug Started', color: 'bg-blue-500' },
                      { date: caseData.event_date, label: 'Event Occurred', color: 'bg-red-500' },
                      { date: caseData.stop_date, label: 'Drug Stopped', color: 'bg-orange-500' },
                      { date: caseData.report_date, label: 'Report Submitted', color: 'bg-green-500' }
                    ].filter(event => event.date).map((event, idx) => (
                      <div key={idx} className="relative mb-8">
                        <div className={`absolute left-[-1.75rem] w-4 h-4 rounded-full ${event.color}`} />
                        <div className="bg-slate-800 rounded-lg p-4">
                          <div className="font-semibold text-slate-200">{event.label}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            {formatDate(event.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Cases Tab */}
              {activeTab === 'related' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Similar Cases ({relatedCases.length})
                  </h3>
                  {relatedCases.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p>No similar cases found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relatedCases.map((relatedCase) => (
                        <div
                          key={relatedCase.id}
                          className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-slate-200">
                                  #{relatedCase.case_number}
                                </span>
                                {relatedCase.serious && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
                                    SERIOUS
                                  </span>
                                )}
                                <span className="text-sm text-slate-400">
                                  Similarity: {(relatedCase.similarity_score * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-sm text-slate-300">
                                <span className="font-medium">{relatedCase.drug_name}</span>
                                {" + "}
                                <span>{relatedCase.reaction}</span>
                              </div>
                              {(relatedCase.patient_age || relatedCase.patient_sex) && (
                                <div className="text-xs text-slate-400 mt-2">
                                  {relatedCase.patient_age && `Age: ${relatedCase.patient_age}`}
                                  {relatedCase.patient_age && relatedCase.patient_sex && ' | '}
                                  {relatedCase.patient_sex && `Sex: ${relatedCase.patient_sex}`}
                                </div>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Export Case Report
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg transition-colors text-center"
                    >
                      <FileText className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <div className="font-semibold text-slate-200 mb-1">Export as PDF</div>
                      <div className="text-xs text-slate-400">
                        Complete case report in PDF format
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport('word')}
                      className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg transition-colors text-center"
                    >
                      <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <div className="font-semibold text-slate-200 mb-1">Export as Word</div>
                      <div className="text-xs text-slate-400">
                        Editable case report in DOCX format
                      </div>
                    </button>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-6">
                    <h4 className="font-semibold text-slate-200 mb-3">Report Contents:</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Patient demographics and medical history
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Drug information and dosing
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Event details and timeline
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Case narrative
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Reporter information
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Related cases analysis
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            {caseData && `Case ID: ${caseData.id}`}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
