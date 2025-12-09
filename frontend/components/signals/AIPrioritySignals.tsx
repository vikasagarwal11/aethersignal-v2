"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PrioritySignal {
  drug: string;
  event: string;
  case_count: number;
  prr: {
    value: number;
    ci_lower: number;
    ci_upper: number;
    is_signal: boolean;
  };
  ror: {
    value: number;
    ci_lower: number;
    ci_upper: number;
    is_signal: boolean;
  };
  ic: {
    value: number;
    ic025: number;
    is_signal: boolean;
  };
  overall: {
    is_signal: boolean;
    signal_strength: string;
    methods_flagged: string[];
  };
  priority: string;
}

interface AIPrioritySignalsProps {
  limit?: number;
  minStrength?: 'weak' | 'moderate' | 'strong';
  onSignalClick?: (signal: PrioritySignal) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        `${API_BASE_URL}/api/v1/signals/statistical?threshold=standard&limit=${limit}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch priority signals');
      
      const data = await response.json();
      
      // Filter by strength and sort by priority
      const filtered = data
        .filter((s: any) => {
          const strength = s.overall?.signal_strength || 'none';
          if (minStrength === 'strong') return strength === 'strong';
          if (minStrength === 'moderate') return strength === 'strong' || strength === 'moderate';
          return strength !== 'none';
        })
        .sort((a: any, b: any) => {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
        })
        .slice(0, limit);
      
      setSignals(filtered);
    } catch (err) {
      console.error('Error fetching priority signals:', err);
      setError('Failed to load priority signals');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityVariant = (priority: string): "danger" | "warning" | "default" | "secondary" => {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'border-l-danger-500';
      case 'HIGH': return 'border-l-warning-500';
      case 'MEDIUM': return 'border-l-primary-500';
      default: return 'border-l-gray-600';
    }
  };

  if (isLoading && signals.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary-500" />
            AI Priority Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary-500" />
            AI Priority Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-danger-500">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchPrioritySignals} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) {
    return null; // Don't show if no signals
  }

  return (
    <Card className="mb-6">
      <CardHeader 
        className="flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary-500" />
          <CardTitle>AI Priority Signals ({signals.length})</CardTitle>
          <Badge variant="quantum" size="sm">High Confidence</Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal, index) => (
            <div
              key={index}
              onClick={() => onSignalClick && onSignalClick(signal)}
              className={`border-l-4 ${getPriorityBorderColor(signal.priority)} bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-750 transition-all`}
            >
              {/* Priority Badge */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white text-base">
                  {signal.drug} + {signal.event}
                </h4>
                <Badge variant={getPriorityVariant(signal.priority)} size="sm">
                  {signal.priority}
                </Badge>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="text-center">
                  <div className="text-gray-400">PRR</div>
                  <div className="font-semibold text-white">
                    {signal.prr.value.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    [{signal.prr.ci_lower.toFixed(1)}-{signal.prr.ci_upper.toFixed(1)}]
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">ROR</div>
                  <div className="font-semibold text-white">
                    {signal.ror.value.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    [{signal.ror.ci_lower.toFixed(1)}-{signal.ror.ci_upper.toFixed(1)}]
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">IC</div>
                  <div className="font-semibold text-white">
                    {signal.ic.value.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    IC025: {signal.ic.ic025.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Methods and Strength */}
              <div className="text-xs text-gray-400 mb-2">
                Methods: {signal.overall.methods_flagged.join(', ')} • Strength: {signal.overall.signal_strength}
              </div>

              {/* Case Count */}
              <div className="text-sm text-gray-300 mb-3">
                {signal.case_count.toLocaleString()} cases
              </div>

              {/* Investigate Button */}
              <Button variant="ghost" size="sm" className="w-full">
                View Details
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

