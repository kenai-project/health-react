import { useState } from 'react';
import { Copy, Download, FileText } from 'lucide-react';

/**
 * SummaryTab - Display extracted text and document summary
 *
 * Features:
 * - Document metadata display
 * - Extracted text viewer
 * - Copy to clipboard
 * - Download extracted text
 * - Loading/empty states
 */
export default function SummaryTab({ document }) {
  const [copied, setCopied] = useState(false);

  const extractedText = document.extracted_text || '';
  const hasExtractedText = extractedText.length > 0;

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.original_filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Metadata section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">File Name</label>
            <p className="text-sm text-gray-900 mt-1">{document.original_filename}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">File Type</label>
            <p className="text-sm text-gray-900 mt-1">{document.mime_type || 'Unknown'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">File Size</label>
            <p className="text-sm text-gray-900 mt-1">{formatFileSize(document.file_size)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <p className="text-sm text-gray-900 mt-1">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                document.status === 'READY' ? 'bg-green-100 text-green-700' :
                document.status === 'EXTRACTING' ? 'bg-blue-100 text-blue-700' :
                document.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {document.status}
              </span>
            </p>
          </div>
          {document.word_count && (
            <div>
              <label className="text-sm font-medium text-gray-700">Word Count</label>
              <p className="text-sm text-gray-900 mt-1">{document.word_count.toLocaleString()}</p>
            </div>
          )}
          {document.page_count && (
            <div>
              <label className="text-sm font-medium text-gray-700">Page Count</label>
              <p className="text-sm text-gray-900 mt-1">{document.page_count}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Uploaded</label>
            <p className="text-sm text-gray-900 mt-1">{formatDate(document.upload_time)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Last Accessed</label>
            <p className="text-sm text-gray-900 mt-1">{formatDate(document.last_accessed)}</p>
          </div>
        </div>
      </div>

      {/* Extracted text section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
          {hasExtractedText && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                aria-label="Copy extracted text to clipboard"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                aria-label="Download extracted text"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>

        {!hasExtractedText ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No extracted text available</p>
            <p className="text-xs text-gray-500">
              {document.status === 'UPLOADED' && 'Click "Extract" to analyze this document.'}
              {document.status === 'EXTRACTING' && 'Extraction is in progress...'}
              {document.status === 'FAILED' && 'Extraction failed. Please try again.'}
            </p>
          </div>
        ) : (
          <div
            className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"
            style={{ maxHeight: '500px', overflowY: 'auto' }}
          >
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {extractedText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}