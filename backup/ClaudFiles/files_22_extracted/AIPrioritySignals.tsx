import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

interface PrioritySignal {
  drug: string;
  event: string;
  case_count: number;
  prr: number;
  ror: number;
  ic: number;
  signal_strength: string;
  priority: string;
  methods_flagged: string[];
}

interface AIPrioritySignalsProps {
  limit?: number;
  minStrength?: 'weak' | 'moderate' | 'strong';
  onSignalClick?: (signal: PrioritySignal) => void;
}

export function AIPrioritySignals({ 
  limit = 3, 
  minStrength = 'moderate',
  onSignalClick 
}: AIPrioritySignalsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [signals, setSignals] = useState<PrioritySignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrioritySignals();
  }, [limit, minStrength]);

  const fetchPrioritySignals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/v1/signals/priority?limit=${limit}&min_strength=${minStrength}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch priority signals');
      
      const data = await response.json();
      setSignals(data);
    } catch (err) {
      console.error('Error fetching priority signals:', err);
      setError('Failed to load priority signals');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-slate-500';
      default: return 'bg-slate-600';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'border-red-600';
      case 'HIGH': return 'border-orange-600';
      case 'MEDIUM': return 'border-yellow-600';
      case 'LOW': return 'border-slate-600';
      default: return 'border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      {/* Header - Collapsible */}
      <div 
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            🎯 AI Priority Signals
            {!isLoading && signals.length > 0 && (
              <span className="text-sm font-normal text-slate-400">
                ({signals.length})
              </span>
            )}
          </h2>
        </div>
        
        {!isExpanded && signals.length > 0 && (
          <div className="flex items-center gap-2">
            {signals.slice(0, 3).map((signal, idx) => (
              <div 
                key={idx}
                className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(signal.priority)} text-white`}
              >
                {signal.priority}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content - Expandable */}
      {isExpanded && (
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading priority signals...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchPrioritySignals}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Retry
              </button>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">No priority signals detected</p>
              <p className="text-xs mt-1">All signals are below the threshold</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signals.map((signal, index) => (
                <div
                  key={index}
                  onClick={() => onSignalClick && onSignalClick(signal)}
                  className={`bg-slate-800 border-l-4 ${getPriorityBorderColor(signal.priority)} rounded-lg p-4 hover:bg-slate-750 transition-all cursor-pointer group`}
                >
                  {/* Priority Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(signal.priority)} text-white`}>
                      {signal.priority}
                    </span>
                    <span className="text-xs text-slate-400">
                      {signal.case_count} cases
                    </span>
                  </div>

                  {/* Drug + Event */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-200 mb-1 group-hover:text-white transition-colors">
                      {signal.drug}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {signal.event}
                    </p>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-slate-400">PRR</div>
                      <div className="font-semibold text-slate-200">
                        {signal.prr.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">ROR</div>
                      <div className="font-semibold text-slate-200">
                        {signal.ror.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">IC</div>
                      <div className="font-semibold text-slate-200">
                        {signal.ic.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Methods */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Methods:</span>
                      <span className="text-slate-300 font-medium">
                        {signal.methods_flagged.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Signal Strength */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            signal.signal_strength === 'strong' ? 'bg-red-500 w-full' :
                            signal.signal_strength === 'moderate' ? 'bg-orange-500 w-2/3' :
                            'bg-yellow-500 w-1/3'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-slate-400 capitalize">
                        {signal.signal_strength}
                      </span>
                    </div>
                  </div>

                  {/* Investigate Button */}
                  <button className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                    Investigate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
