import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import UploadProgress from './UploadProgress';
import Modal from './Modal';

/**
 * DocumentUploader - Drag-and-drop file upload modal
 *
 * Features:
 * - Drag-and-drop zone
 * - Click to browse
 * - Multi-file selection
 * - Client-side validation
 * - Upload progress per file
 * - Cancel upload
 * - Accessible (keyboard, ARIA)
 */
export default function DocumentUploader({
  isOpen,
  onClose,
  onUpload,
  uploading,
  uploadProgress,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [cancelled, setCancelled] = useState({});
  const inputRef = useRef(null);
  const xhrRef = useRef({});

  const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
    'text/plain': ['.txt'],
  };

  const MAX_SIZE = 20 * 1024 * 1024; // 20MB

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    // Check extension
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.csv', '.txt'];
    if (!allowedExtensions.includes(ext)) {
      return `Invalid file type: ${ext}. Allowed: ${allowedExtensions.join(', ')}`;
    }

    // Check size
    if (file.size > MAX_SIZE) {
      return `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: 20MB`;
    }

    return null;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = (files) => {
    const newErrors = {};
    const validFiles = [];

    files.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        newErrors[`${Date.now()}-${index}`] = error;
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await onUpload(selectedFiles);
      // Clear on success
      setSelectedFiles([]);
      setErrors({});
      onClose();
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setErrors({});
    onClose();
  };

  const handleCancelUpload = (index) => {
    setCancelled(prev => ({ ...prev, [index]: true }));
    // Note: Actual XHR cancellation would require tracking XHR objects
    // For now, just mark as cancelled
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Upload documents" maxWidth="max-w-2xl">
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Drag and drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label="Drag and drop files here or click to browse"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported: PDF, DOCX, XLSX, CSV, TXT (max 20MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.csv,.txt"
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Selected Files ({selectedFiles.length})
            </h3>
            {selectedFiles.map((file, index) => (
              <UploadProgress
                key={index}
                file={file}
                progress={uploadProgress[index] || 0}
                status={cancelled[index] ? 'error' : (uploading ? 'uploading' : 'pending')}
                error={cancelled[index] ? 'Cancelled' : errors[index]}
                onCancel={() => handleCancelUpload(index)}
              />
            ))}
          </div>
        )}

        {/* Error messages */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Some files could not be added. Please check the errors above.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t">
        <button
          onClick={handleCancel}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
        </button>
      </div>
    </Modal>
  );
}
