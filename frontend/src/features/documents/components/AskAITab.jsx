import { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageSquare, Copy, Check, Square } from 'lucide-react';
import { documentService } from '@/app/services/api';
import { useLanguage } from '@/app/i18n/LanguageContext';

/**
 * AskAITab - Ask questions about the document with AI
 *
 * Features:
 * - Chat interface
 * - Message list with citations
 * - Input field
 * - Streaming support (future)
 * - Analysis history
 * - Regenerate analysis
 */

const ANALYSIS_TYPES = {
  SUMMARY: 'summary',
  EXPLANATION: 'explanation',
  QA: 'qa',
};

export default function AskAITab({ document }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load analysis history on mount
  useEffect(() => {
    loadAnalysisHistory();
  }, [document.id]);

  const loadAnalysisHistory = async () => {
    try {
      const result = await documentService.getAnalyses(document.id);
      if (result.success && result.data) {
        setAnalysisHistory(result.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load analysis history:', err);
    }
  };

  const handleGenerateSummary = async () => {
    await generateAnalysisStream('summary');
  };

  const handleGenerateExplanation = async () => {
    await generateAnalysisStream('explanation');
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await generateAnalysisStream('qa', input.trim());
    setInput('');
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreaming(false);
    setLoading(false);
  };

  const generateAnalysisStream = async (type, question = null) => {
    setLoading(true);
    setStreaming(true);

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question || `Generate ${type}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add initial assistant message (empty, streaming)
    const assistantMessageId = Date.now() + 1;
    let accumulatedContent = '';
    let accumulatedCitations = [];

    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date().toISOString(),
      streaming: true,
    }]);

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const updateMessage = (content, citations) => {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, content, citations, streaming: true }
          : m
      ));
    };

    const finalizeMessage = (content, citations, isError = false) => {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, content, citations, streaming: false, isError }
          : m
      ));
    };

    try {
      const handleEvent = (event) => {
        if (event.type === 'chunk') {
          accumulatedContent += event.content;
          updateMessage(accumulatedContent, accumulatedCitations);
        } else if (event.type === 'citations') {
          accumulatedCitations = event.citations;
          updateMessage(accumulatedContent, accumulatedCitations);
        } else if (event.type === 'done') {
          finalizeMessage(accumulatedContent, accumulatedCitations);
          loadAnalysisHistory();
        } else if (event.type === 'error') {
          finalizeMessage(`Error: ${event.message}`, [], true);
        }
      };

      if (type === 'qa') {
        await documentService.askQuestionStream(
          document.id,
          question,
          handleEvent,
          controller.signal,
          language
        );
      } else {
        const streamFn = type === 'summary'
          ? documentService.generateSummaryStream
          : documentService.generateExplanationStream;
        await streamFn(document.id, handleEvent, controller.signal, language);
      }
    } catch (err) {
      finalizeMessage(`Error: ${err.message || 'Failed to generate analysis'}`, [], true);
    } finally {
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async (analysisId) => {
    try {
      setLoading(true);
      const result = await documentService.regenerateAnalysis(document.id, analysisId);
      if (result.success && result.data) {
        const aiMessage = {
          id: Date.now(),
          role: 'assistant',
          content: result.data.content,
          citations: result.data.citations || [],
          timestamp: result.data.generated_at,
          cached: false,
        };
        setMessages(prev => [...prev, aiMessage]);
        await loadAnalysisHistory();
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCitations = (citations) => {
    if (!citations || citations.length === 0) return '';
    return citations.map(c => `Page ${c.page_number}, Chunk ${c.chunk_index}`).join('; ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Summarize
        </button>
        <button
          onClick={handleGenerateExplanation}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Explain
        </button>
        {streaming && (
          <button
            onClick={handleStop}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            <Square className="w-4 h-4 inline mr-1" />
            Stop
          </button>
        )}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          History ({analysisHistory.length})
        </button>
      </div>

      {/* Analysis history dropdown */}
      {showHistory && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Analysis History</h4>
          {analysisHistory.length === 0 ? (
            <p className="text-xs text-gray-500">No analyses yet</p>
          ) : (
            <div className="space-y-2">
              {analysisHistory.map(analysis => (
                <div key={analysis.id} className="flex items-start justify-between gap-2 p-2 bg-white rounded border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">{analysis.type}</p>
                    <p className="text-xs text-gray-500 truncate">{analysis.content.substring(0, 100)}...</p>
                  </div>
                  <button
                    onClick={() => handleRegenerate(analysis.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Regenerate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4" style={{ maxHeight: '400px' }}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No messages yet</p>
            <p className="text-xs text-gray-500">
              Click "Summarize" or "Explain" to get started, or ask a question below.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isError
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Sources:</p>
                    <p className="text-xs text-gray-500">{formatCitations(message.citations)}</p>
                  </div>
                )}

                {/* Actions */}
                {!message.isError && message.role === 'assistant' && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      {copiedId === message.id ? <Check className="w-3 h-3 inline" /> : <Copy className="w-3 h-3 inline" />}
                      {copiedId === message.id ? 'Copied' : 'Copy'}
                    </button>
                    {message.cached && (
                      <span className="text-xs text-gray-500">(cached)</span>
                    )}
                  </div>
                )}

                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {loading && !streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendQuestion} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Ask a question about this document"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send question"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
