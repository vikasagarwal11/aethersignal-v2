import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'duplicate';
  progress: number;
  error?: string;
  cases_created?: number;
  valid_cases?: number;
  invalid_cases?: number;
  duplicate_action?: 'skip' | 'replace' | 'keep';
}

interface MultiFileUploadProps {
  onUploadComplete?: (results: any[]) => void;
  onSessionCreated?: (sessionId: string) => void;
}

export function MultiFileUpload({ onUploadComplete, onSessionCreated }: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<UploadFile[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const checkForDuplicates = async (file: File): Promise<boolean> => {
    try {
      // Calculate MD5 hash (simplified - in production use crypto-js)
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check against server
      const response = await fetch('/api/v1/upload/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          hash: hashHex,
          size: file.size
        })
      });

      const data = await response.json();
      return data.is_duplicate;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const { id, file } = uploadFile;

    try {
      // Check for duplicates
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      const isDuplicate = await checkForDuplicates(file);
      
      if (isDuplicate) {
        setFiles(prev => prev.map(f =>
          f.id === id ? { ...f, status: 'duplicate', progress: 0 } : f
        ));
        setDuplicateFiles(prev => [...prev, uploadFile]);
        return;
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 80; // 0-80% for upload
          setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, progress: percentComplete } : f
          ));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          setFiles(prev => prev.map(f =>
            f.id === id ? {
              ...f,
              status: 'processing',
              progress: 80
            } : f
          ));

          // Simulate processing (in production, poll for status)
          setTimeout(() => {
            setFiles(prev => prev.map(f =>
              f.id === id ? {
                ...f,
                status: 'completed',
                progress: 100,
                cases_created: response.cases_created || 0,
                valid_cases: response.valid_cases || 0,
                invalid_cases: response.invalid_cases || 0
              } : f
            ));
          }, 2000);
        } else {
          setFiles(prev => prev.map(f =>
            f.id === id ? {
              ...f,
              status: 'error',
              progress: 0,
              error: 'Upload failed'
            } : f
          ));
        }
      });

      xhr.addEventListener('error', () => {
        setFiles(prev => prev.map(f =>
          f.id === id ? {
            ...f,
            status: 'error',
            progress: 0,
            error: 'Network error'
          } : f
        ));
      });

      xhr.open('POST', '/api/v1/upload/');
      xhr.send(formData);

    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.id === id ? {
          ...f,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : f
      ));
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Upload files sequentially (can be parallel if needed)
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Show duplicate modal if any duplicates found
    if (duplicateFiles.length > 0) {
      setShowDuplicateModal(true);
    }

    // Notify parent
    const results = files.filter(f => f.status === 'completed');
    if (onUploadComplete) {
      onUploadComplete(results);
    }
  };

  const handleDuplicateAction = async (fileId: string, action: 'skip' | 'replace' | 'keep') => {
    const file = duplicateFiles.find(f => f.id === fileId);
    if (!file) return;

    if (action === 'skip') {
      // Just mark as skipped
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, duplicate_action: 'skip', status: 'completed' } : f
      ));
    } else if (action === 'replace' || action === 'keep') {
      // Upload with action flag
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('duplicate_action', action);

      try {
        const response = await fetch('/api/v1/upload/', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        setFiles(prev => prev.map(f =>
          f.id === fileId ? {
            ...f,
            status: 'completed',
            progress: 100,
            duplicate_action: action,
            cases_created: data.cases_created,
            valid_cases: data.valid_cases,
            invalid_cases: data.invalid_cases
          } : f
        ));
      } catch (error) {
        console.error('Error handling duplicate:', error);
      }
    }

    setDuplicateFiles(prev => prev.filter(f => f.id !== fileId));
    
    if (duplicateFiles.length <= 1) {
      setShowDuplicateModal(false);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-slate-400" />;
      case 'uploading':
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'duplicate':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'border-slate-700';
      case 'uploading': return 'border-blue-500';
      case 'processing': return 'border-purple-500';
      case 'completed': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'duplicate': return 'border-yellow-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const duplicateCount = files.filter(f => f.status === 'duplicate').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
            : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
        <h3 className="text-xl font-semibold text-slate-200 mb-2">
          {isDragging ? 'Drop files here' : 'Upload Safety Reports'}
        </h3>
        <p className="text-slate-400 mb-4">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Supports: PDF, Excel (.xlsx, .xls, .csv), XML (E2B), Word (.docx)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.xml,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Select Files
        </button>
      </div>

      {/* Upload Progress Summary */}
      {files.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-200">{totalFiles}</div>
              <div className="text-xs text-slate-400">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{completedFiles}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{errorFiles}</div>
              <div className="text-xs text-slate-400">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{duplicateCount}</div>
              <div className="text-xs text-slate-400">Duplicates</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUploadAll}
              disabled={isUploading || files.filter(f => f.status === 'pending').length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload All ({files.filter(f => f.status === 'pending').length})
                </>
              )}
            </button>
            <button
              onClick={() => setFiles([])}
              disabled={isUploading}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">Files ({files.length})</h3>
          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className={`bg-slate-800 rounded-lg p-4 border-l-4 ${getStatusColor(uploadFile.status)}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(uploadFile.status)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-200 truncate">
                      {uploadFile.file.name}
                    </h4>
                    <span className="text-xs text-slate-400 ml-2">
                      {formatFileSize(uploadFile.file.size)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">
                          {uploadFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {Math.round(uploadFile.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            uploadFile.status === 'uploading' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  {uploadFile.status === 'completed' && (
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>✓ {uploadFile.cases_created} cases created</span>
                      {uploadFile.valid_cases !== undefined && (
                        <span className="text-green-400">{uploadFile.valid_cases} valid</span>
                      )}
                      {uploadFile.invalid_cases !== undefined && uploadFile.invalid_cases > 0 && (
                        <span className="text-orange-400">{uploadFile.invalid_cases} invalid</span>
                      )}
                    </div>
                  )}

                  {uploadFile.status === 'error' && (
                    <div className="text-xs text-red-400">
                      Error: {uploadFile.error || 'Upload failed'}
                    </div>
                  )}

                  {uploadFile.status === 'duplicate' && (
                    <div className="text-xs text-yellow-400">
                      Duplicate file detected - choose action below
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && duplicateFiles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-slate-200">
                Duplicate Files Detected ({duplicateFiles.length})
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Choose how to handle duplicate files
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {duplicateFiles.map((dupFile) => (
                <div key={dupFile.id} className="bg-slate-800 rounded-lg p-4">
                  <div className="font-medium text-slate-200 mb-3">
                    {dupFile.file.name}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleDuplicateAction(dupFile.id, 'skip')}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors text-sm"
                    >
                      Skip
                      <div className="text-xs text-slate-400 mt-1">Don't upload</div>
                    </button>
                    <button
                      onClick={() => handleDuplicateAction(dupFile.id, 'replace')}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm"
                    >
                      Replace
                      <div className="text-xs text-orange-200 mt-1">Overwrite existing</div>
                    </button>
                    <button
                      onClick={() => handleDuplicateAction(dupFile.id, 'keep')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                    >
                      Keep Both
                      <div className="text-xs text-blue-200 mt-1">Upload as new</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
