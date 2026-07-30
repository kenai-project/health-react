import { X, CheckCircle, XCircle, Loader } from 'lucide-react';

/**
 * UploadProgress - Individual file upload progress indicator
 *
 * Props:
 * - file: File object
 * - progress: number (0-100)
 * - status: 'uploading' | 'processing' | 'complete' | 'error'
 * - error: string | null
 * - onCancel: () => void
 */
export default function UploadProgress({
  file,
  progress,
  status,
  error,
  onCancel,
}) {
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* File name and size */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </p>
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formatFileSize(file.size)}
            </span>
          </div>

          {/* Progress bar */}
          {status === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Upload progress: ${Math.round(progress)}%`}
              />
            </div>
          )}

          {/* Status text */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {status === 'uploading' && `Uploading... ${Math.round(progress)}%`}
              {status === 'processing' && 'Processing...'}
              {status === 'complete' && 'Upload complete'}
              {status === 'error' && (error || 'Upload failed')}
            </p>

            {/* Cancel button */}
            {status === 'uploading' && onCancel && (
              <button
                onClick={onCancel}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Cancel upload of ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}