import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { SessionSidebar } from './SessionSidebar';
import { AIPrioritySignals } from './AIPrioritySignals';
import { ChatInterface } from './ChatInterface';

interface Signal {
  drug: string;
  event: string;
  case_count: number;
  prr: number;
  prr_ci: string;
  prr_is_signal: boolean;
  ror: number;
  ror_ci: string;
  ror_is_signal: boolean;
  ic: number;
  ic025: number;
  ic_is_signal: boolean;
  is_signal: boolean;
  signal_strength: string;
  methods: string;
  priority: string;
}

export function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [signalsOnly, setSignalsOnly] = useState(false);
  const [sortField, setSortField] = useState<string>('prr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSignals();
  }, [selectedSession, signalsOnly]);

  useEffect(() => {
    filterAndSortSignals();
  }, [signals, searchQuery, selectedPriority, sortField, sortDirection]);

  const fetchSignals = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        dataset: selectedSession === 'all' ? 'all' : selectedSession,
        signals_only: signalsOnly.toString(),
        method: 'all',
        limit: '1000'
      });

      const response = await fetch(`/api/v1/signals/?${params}`);
      if (!response.ok) throw new Error('Failed to fetch signals');
      
      const data = await response.json();
      setSignals(data);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSignals = () => {
    let filtered = [...signals];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.drug.toLowerCase().includes(query) ||
        s.event.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(s => s.priority === selectedPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Signal];
      let bValue: any = b[sortField as keyof Signal];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSignals(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'CRITICAL': 'bg-red-500 text-white',
      'HIGH': 'bg-orange-500 text-white',
      'MEDIUM': 'bg-yellow-500 text-slate-900',
      'LOW': 'bg-slate-500 text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[priority as keyof typeof colors] || colors.LOW}`}>
        {priority}
      </span>
    );
  };

  const getSignalIndicator = (isSignal: boolean) => {
    return isSignal ? (
      <span className="text-green-400 font-bold">✓</span>
    ) : (
      <span className="text-slate-500">—</span>
    );
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Session Sidebar */}
      <SessionSidebar 
        onSessionChange={setSelectedSession}
        currentSessionId={selectedSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* AI Priority Signals - Compact & Collapsible */}
        <AIPrioritySignals limit={3} minStrength="moderate" />

        {/* Dashboard Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-950">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Total Cases</div>
            <div className="text-3xl font-bold text-slate-200">
              {signals.reduce((sum, s) => sum + s.case_count, 0)}
            </div>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Critical Signals</div>
            <div className="text-3xl font-bold text-red-400">
              {signals.filter(s => s.priority === 'CRITICAL').length}
            </div>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Confirmed Signals</div>
            <div className="text-3xl font-bold text-orange-400">
              {signals.filter(s => s.is_signal).length}
            </div>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Signal Rate</div>
            <div className="text-3xl font-bold text-blue-400">
              {signals.length > 0 ? Math.round((signals.filter(s => s.is_signal).length / signals.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-6 pb-4 bg-slate-950">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search drug or reaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Signals Only Toggle */}
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={signalsOnly}
                onChange={(e) => setSignalsOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">Signals Only</span>
            </label>

            {/* Refresh */}
            <button
              onClick={fetchSignals}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export */}
            <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Signals Table */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800 sticky top-0">
                <tr className="text-left text-sm text-slate-300">
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('drug')}>
                    DRUG <SortIcon field="drug" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('event')}>
                    REACTION <SortIcon field="event" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort('prr')}>
                    PRR <SortIcon field="prr" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort('ror')}>
                    ROR <SortIcon field="ror" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort('ic')}>
                    IC <SortIcon field="ic" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort('case_count')}>
                    CASES <SortIcon field="case_count" />
                  </th>
                  <th className="px-4 py-3 text-center">SIGNAL</th>
                  <th className="px-4 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>
                    PRIORITY <SortIcon field="priority" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading signals...
                    </td>
                  </tr>
                ) : filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      No signals found
                    </td>
                  </tr>
                ) : (
                  filteredSignals.map((signal, index) => (
                    <tr 
                      key={index}
                      className="border-t border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">{signal.drug}</td>
                      <td className="px-4 py-3 text-slate-300">{signal.event}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-slate-200 font-medium">{signal.prr.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">{signal.prr_ci}</div>
                        <div className="text-xs">{getSignalIndicator(signal.prr_is_signal)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-slate-200 font-medium">{signal.ror.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">{signal.ror_ci}</div>
                        <div className="text-xs">{getSignalIndicator(signal.ror_is_signal)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-slate-200 font-medium">{signal.ic.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">{signal.ic025.toFixed(2)}</div>
                        <div className="text-xs">{getSignalIndicator(signal.ic_is_signal)}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-200 font-medium">
                        {signal.case_count}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          signal.signal_strength === 'strong' ? 'bg-red-900 text-red-200' :
                          signal.signal_strength === 'moderate' ? 'bg-orange-900 text-orange-200' :
                          signal.signal_strength === 'weak' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {signal.signal_strength}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">{signal.methods}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPriorityBadge(signal.priority)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Results Summary */}
          {!isLoading && filteredSignals.length > 0 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              Showing {filteredSignals.length} of {signals.length} signals
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface - Fixed at bottom */}
      <ChatInterface onQuerySubmit={(query) => console.log('Query:', query)} />
    </div>
  );
}

export default SignalsPage;
