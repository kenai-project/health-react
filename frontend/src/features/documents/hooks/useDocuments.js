import { useState, useEffect, useCallback, useRef } from 'react';
import { documentService } from '@/app/services/api';

/**
 * useDocuments - Reusable hook for document operations
 *
 * Encapsulates:
 * - list, refresh, upload, delete, extract
 * - loading, error states
 * - pagination
 * - polling for EXTRACTING documents
 */
export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Polling ref to track interval
  const pollingIntervalRef = useRef(null);

  // Fetch documents
  const fetchDocuments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await documentService.list({
        page: params.page || pagination.page,
        per_page: params.per_page || pagination.per_page,
        search: params.search || '',
        type: params.type || '',
      });
      setDocuments(result.data.items);
      setPagination({
        page: result.data.page,
        per_page: result.data.per_page,
        total: result.data.total,
      });
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page]);

  // Upload documents
  const uploadDocuments = useCallback(async (files) => {
    try {
      setUploading(true);
      setError(null);

      // Optimistic update: add documents with UPLOADED status
      const optimisticDocs = Array.from(files).map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        status: 'UPLOADED',
        upload_time: new Date().toISOString(),
        isOptimistic: true,
      }));
      setDocuments(prev => [...optimisticDocs, ...prev]);

      // Track progress
      const progressMap = {};
      files.forEach((file, index) => {
        progressMap[index] = 0;
      });
      setUploadProgress(progressMap);

      // Upload
      // NOTE: documentService.upload calls onProgress(ratio) with a single
      // ratio argument (0..1) for the whole batch, so there is no per-file
      // index in scope here. Update every tracked file's progress together.
      const result = await documentService.upload(files, (ratio) => {
        const progress = Math.min(100, Math.max(0, ratio * 100));
        setUploadProgress(prev => {
          const next = {};
          Object.keys(prev).forEach(key => {
            next[key] = progress;
          });
          return next;
        });
      });

      // Replace optimistic docs with real ones
      if (result.success && result.data) {
        const realDocs = result.data.documents
          .filter(d => d.success && d.data)
          .map(d => d.data);
        setDocuments(prev => {
          const filtered = prev.filter(d => !d.isOptimistic);
          return [...realDocs, ...filtered];
        });
      }

      setUploading(false);
      setUploadProgress({});
      return result;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress({});
      // Remove optimistic docs on error
      setDocuments(prev => prev.filter(d => !d.isOptimistic));
      throw err;
    }
  }, []);

  // Delete document
  const deleteDocument = useCallback(async (documentId) => {
    try {
      setError(null);
      await documentService.delete(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      setError(err.message || 'Delete failed');
      throw err;
    }
  }, []);

  // Extract document
  const extractDocument = useCallback(async (documentId) => {
    try {
      setError(null);
      await documentService.extract(documentId);
      // Update document status to EXTRACTING
      setDocuments(prev =>
        prev.map(d =>
          d.id === documentId ? { ...d, status: 'EXTRACTING' } : d
        )
      );
    } catch (err) {
      setError(err.message || 'Extraction failed');
      throw err;
    }
  }, []);

  // Poll for EXTRACTING documents
  useEffect(() => {
    const hasExtracting = documents.some(d => d.status === 'EXTRACTING');

    if (hasExtracting) {
      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchDocuments();
      }, 2000);
    } else {
      // Clear interval if no documents are extracting
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [documents, fetchDocuments]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh
  const refresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Change page
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchDocuments({ page: newPage });
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    pagination,
    uploading,
    uploadProgress,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    extractDocument,
    refresh,
    changePage,
    setError,
  };
}