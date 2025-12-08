import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, RefreshCw, Settings } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  started_at: string;
  files_count: number;
  cases_created: number;
  valid_cases: number;
  invalid_cases: number;
  status: string;
  is_current: boolean;
}

interface SessionSidebarProps {
  onSessionChange?: (sessionId: string) => void;
  currentSessionId?: string;
}

export function SessionSidebar({ onSessionChange, currentSessionId = 'all' }: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/sessions/');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      
      // Add "All Sessions" option
      const allSessionsOption: Session = {
        id: 'all',
        name: 'All Sessions',
        started_at: new Date().toISOString(),
        files_count: data.reduce((sum: number, s: Session) => sum + s.files_count, 0),
        cases_created: data.reduce((sum: number, s: Session) => sum + s.cases_created, 0),
        valid_cases: data.reduce((sum: number, s: Session) => sum + s.valid_cases, 0),
        invalid_cases: data.reduce((sum: number, s: Session) => sum + s.invalid_cases, 0),
        status: 'completed',
        is_current: false
      };
      
      setSessions([allSessionsOption, ...data]);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (onSessionChange) {
      onSessionChange(sessionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'partial': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            📅 Sessions
          </h2>
          <button
            onClick={fetchSessions}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400">
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedSessionId === session.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {session.id === 'all' ? session.name : formatDate(session.started_at)}
                    </span>
                  </div>
                  {session.is_current && (
                    <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="text-xs space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className={selectedSessionId === session.id ? 'text-blue-100' : 'text-slate-400'}>
                      {session.files_count} files
                    </span>
                    <span className={selectedSessionId === session.id ? 'text-blue-100' : 'text-slate-400'}>
                      {session.cases_created} cases
                    </span>
                  </div>
                  
                  {session.id !== 'all' && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">
                        ✓ {session.valid_cases}
                      </span>
                      {session.invalid_cases > 0 && (
                        <span className="text-orange-400">
                          ⚠ {session.invalid_cases}
                        </span>
                      )}
                      <span className={`ml-auto ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          🔍 Quick Actions
        </div>
        
        <button className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Signals
        </button>
        
        <button className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Export Data
        </button>
        
        <button className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          View Analytics
        </button>
        
        <button className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Current Selection Summary */}
      {selectedSessionId && sessions.length > 0 && (
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Current View</div>
          <div className="text-sm font-medium text-slate-200">
            {sessions.find(s => s.id === selectedSessionId)?.name || 
             formatDate(sessions.find(s => s.id === selectedSessionId)?.started_at || '')}
          </div>
          {selectedSessionId !== 'all' && (
            <div className="text-xs text-slate-400 mt-1">
              {sessions.find(s => s.id === selectedSessionId)?.cases_created || 0} total cases
            </div>
          )}
        </div>
      )}
    </div>
  );
}
