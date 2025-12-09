"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, RefreshCw, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Session {
  id: string;
  name: string;
  started_at?: string;  // Add started_at for date formatting
  files_count: number;
  cases_created: number;
}

interface SessionSidebarProps {
  onSessionChange?: (sessionId: string) => void;
  currentSessionId?: string;
  totalCases?: number;
  totalSignals?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function SessionSidebar({ 
  onSessionChange, 
  currentSessionId = 'all',
  totalCases = 0,
  totalSignals = 0
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    
    try {
      // Get organization from localStorage (for multi-tenant support)
      const organization = typeof window !== 'undefined' 
        ? localStorage.getItem('organization') 
        : null;
      
      // Build API URL with organization parameter
      const url = new URL(`${API_BASE_URL}/api/v1/sessions/`);
      if (organization) {
        url.searchParams.append('organization', organization);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      
      // Add "All Sessions" option
      const allSessionsOption: Session = {
        id: 'all',
        name: 'All Sessions',
        files_count: data.reduce((sum: number, s: Session) => sum + (s.files_count || 0), 0),
        cases_created: data.reduce((sum: number, s: Session) => sum + (s.cases_created || 0), 0)
      };
      
      setSessions([allSessionsOption, ...data]);
    } catch (err) {
      console.error('Error fetching sessions:', err);
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Invalid Date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getSessionDisplayName = (session: Session) => {
    if (session.id === 'all') {
      return session.name;
    }
    
    // If session has started_at, use it for date formatting
    if (session.started_at) {
      return formatDate(session.started_at);
    }
    
    // Otherwise, try to parse the name as a date (for auto-sessions like "Session 2024-12-08")
    // Extract date from name if it matches pattern "Session YYYY-MM-DD"
    const dateMatch = session.name.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return formatDate(dateMatch[1]);
    }
    
    // If name doesn't contain a date, just return the name (user-created session)
    return session.name;
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            📅 Sessions
          </h3>
          <button
            onClick={fetchSessions}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Refresh sessions"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading sessions...</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSessionId === session.id
                    ? 'bg-primary-500/20 border border-primary-500'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-white text-sm">
                  {getSessionDisplayName(session)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {session.files_count} files • {session.cases_created} cases
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          🔍 Quick Actions
        </h3>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Signals
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Current Selection Summary */}
      {selectedSessionId && sessions.length > 0 && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Current View</div>
          <div className="text-sm font-medium text-white">
            {sessions.find(s => s.id === selectedSessionId)?.name || 'All Sessions'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {totalCases} cases • {totalSignals} signals
          </div>
        </div>
      )}
    </div>
  );
}

