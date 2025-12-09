import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, AlertCircle, Trash2, Download, Copy } from 'lucide-react';

interface UploadHistory {
  id: string;
  filename: string;
  file_hash: string;
  file_size: number;
  uploaded_at: string;
  status: string;
  cases_created: number;
  cases_valid: number;
  cases_invalid: number;
  is_duplicate: boolean;
  has_duplicates: boolean;
  duplicate_count: number;
  session_id?: string;
}

export function UploadHistoryTracker() {
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'duplicates' | 'recent'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/upload/history?limit=50`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching upload history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Delete this upload and all associated cases?')) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/upload/${uploadId}`, { method: 'DELETE' });
      fetchHistory();
    } catch (error) {
      console.error('Error deleting upload:', error);
    }
  };

  const handleMergeDuplicates = async (primaryId: string, duplicateId: string) => {
    if (!confirm('Merge these duplicate uploads?')) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/upload/${primaryId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge_with_id: duplicateId })
      });
      fetchHistory();
    } catch (error) {
      console.error('Error merging duplicates:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredHistory = history.filter(upload => {
    if (selectedFilter === 'duplicates') return upload.has_duplicates;
    if (selectedFilter === 'recent') {
      const uploadDate = new Date(upload.uploaded_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return uploadDate > oneDayAgo;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">Upload History</h2>
        <div className="flex gap-2">
          {['all', 'recent', 'duplicates'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Total Uploads</div>
          <div className="text-2xl font-bold text-slate-200">{history.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Duplicates</div>
          <div className="text-2xl font-bold text-yellow-400">
            {history.filter(h => h.has_duplicates).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Total Cases</div>
          <div className="text-2xl font-bold text-green-400">
            {history.reduce((sum, h) => sum + h.cases_created, 0)}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Total Size</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatFileSize(history.reduce((sum, h) => sum + h.file_size, 0))}
          </div>
        </div>
      </div>

      {/* Upload List */}
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p>No uploads found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredHistory.map((upload) => (
              <div key={upload.id} className="p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(upload.status)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-200 truncate">
                        {upload.filename}
                      </h3>
                      {upload.is_duplicate && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 rounded text-xs font-bold">
                          DUPLICATE
                        </span>
                      )}
                      {upload.has_duplicates && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-bold">
                          {upload.duplicate_count} COPIES
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm text-slate-400">
                      <div>
                        <span className="text-slate-500">Uploaded:</span> {formatDate(upload.uploaded_at)}
                      </div>
                      <div>
                        <span className="text-slate-500">Size:</span> {formatFileSize(upload.file_size)}
                      </div>
                      <div>
                        <span className="text-slate-500">Cases:</span> {upload.cases_created}
                        {upload.cases_valid > 0 && (
                          <span className="text-green-400 ml-1">({upload.cases_valid} valid)</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500">Hash:</span>{' '}
                        <code className="text-xs">{upload.file_hash.substring(0, 8)}...</code>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                    {upload.has_duplicates && (
                      <button
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                        title="Merge duplicates"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

