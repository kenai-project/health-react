import { useState, useEffect, useRef, useCallback } from 'react';
import GlassCard from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Bot,
  Send,
  RefreshCw,
  Activity,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { llmService } from '../services/api';
import VoiceButton from '../../features/voice/components/VoiceButton';
import AutoSpeakToggle from '../../features/voice/components/AutoSpeakToggle';
import useSpeechSynthesis from '../../features/voice/hooks/useSpeechSynthesis';

const LLMAssistantPage = () => {
  // Health status
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Analyze
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Suggestions
  const [suggestionsResult, setSuggestionsResult] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Disclaimer
  const [disclaimer, setDisclaimer] = useState('');

  // Voice — auto-speak state (persisted in localStorage)
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(() => {
    return localStorage.getItem('autoSpeak') === 'true';
  });

  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis({
    rate: 1.0,
    pitch: 1.0,
  });

  const handleAutoSpeakToggle = useCallback((enabled) => {
    setAutoSpeakEnabled(enabled);
    localStorage.setItem('autoSpeak', enabled ? 'true' : 'false');
  }, []);

  // Voice transcript handler — fills input and auto-sends
  const handleVoiceTranscript = useCallback((transcript) => {
    if (!transcript.trim()) return;
    setChatInput(transcript);
    // Auto-send after a brief delay so user sees the text
    setTimeout(() => {
      if (transcript.trim()) {
        // We need to trigger send with the transcript directly
        // since setChatInput is async
        setChatInput('');
        const userMessage = { role: 'user', content: transcript.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setChatLoading(true);
        llmService.chat(transcript.trim(), messages)
          .then((response) => {
            const assistantMessage = { role: 'assistant', content: response.reply };
            setMessages((prev) => [...prev, assistantMessage]);
            if (response.disclaimer) {
              setDisclaimer(response.disclaimer);
            }
            if (autoSpeakEnabled && response.reply) {
              speak(response.reply);
            }
          })
          .catch((error) => {
            const errorMsg = error.response?.data?.detail || 'Failed to send message';
            toast.error(errorMsg);
          })
          .finally(() => {
            setChatLoading(false);
          });
      }
    }, 300);
  }, [messages, autoSpeakEnabled, speak]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load health status on mount
  const loadHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const result = await llmService.checkHealth();
      setHealthStatus(result);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Failed to check LLM health';
      toast.error(errorMsg);
      setHealthStatus({ status: 'error', detail: errorMsg });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadHealthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chat handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const message = chatInput.trim();
    setChatInput('');

    // Cancel any ongoing speech when user sends a new message
    if (isSpeaking) {
      cancelSpeech();
    }

    // Add user message to UI
    const userMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);

    setChatLoading(true);
    try {
      // Pass current messages as history (backend appends current message)
      const response = await llmService.chat(message, messages);
      const assistantMessage = { role: 'assistant', content: response.reply };
      setMessages((prev) => [...prev, assistantMessage]);
      if (response.disclaimer) {
        setDisclaimer(response.disclaimer);
      }
      // Auto-speak the response if enabled
      if (autoSpeakEnabled && response.reply) {
        speak(response.reply);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Failed to send message';
      toast.error(errorMsg);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Analyze handler
  const handleAnalyze = async () => {
    setAnalyzeLoading(true);
    setAnalyzeResult('');
    try {
      const response = await llmService.analyze(10);
      setAnalyzeResult(response.analysis);
      if (response.disclaimer) {
        setDisclaimer(response.disclaimer);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Failed to analyze health data';
      toast.error(errorMsg);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Suggestions handler
  const handleSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestionsResult('');
    try {
      const response = await llmService.suggestions(10);
      setSuggestionsResult(response.suggestions);
      if (response.disclaimer) {
        setDisclaimer(response.disclaimer);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || 'Failed to generate suggestions';
      toast.error(errorMsg);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Health status display helpers
  const getHealthStatusIcon = () => {
    if (healthLoading)
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
    if (!healthStatus)
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    if (healthStatus.status === 'ok' && healthStatus.model_available)
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (healthStatus.status === 'model_not_found')
      return <XCircle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getHealthStatusText = () => {
    if (healthLoading) return 'Checking LLM availability...';
    if (!healthStatus) return 'Not checked';
    if (healthStatus.status === 'ok' && healthStatus.model_available)
      return `Ollama is running (model: ${healthStatus.model})`;
    if (healthStatus.status === 'model_not_found')
      return `Ollama running but model '${healthStatus.model}' not found`;
    return healthStatus.detail || 'LLM service unavailable';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI Health Assistant
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Chat with your personal AI health assistant powered by local Ollama
        </p>
      </div>

      {/* Health Status */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getHealthStatusIcon()}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                LLM Health Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getHealthStatusText()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHealthStatus}
            disabled={healthLoading}
            className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
          >
            <RefreshCw
              className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </GlassCard>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Chat with AI Assistant
              </h3>
              <AutoSpeakToggle
                enabled={autoSpeakEnabled}
                onToggle={handleAutoSpeakToggle}
                isSpeaking={isSpeaking}
                onStop={cancelSpeech}
              />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ask me anything about your health data!</p>
                  <p className="text-xs mt-2">
                    Try: "What trends do you see in my weight?"
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-auto max-w-[80%]'
                        : 'bg-gray-50 dark:bg-gray-800/50 mr-auto max-w-[80%]'
                    }`}
                  >
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or click the mic to speak..."
                disabled={chatLoading}
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              />
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                disabled={chatLoading}
                size="md"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {chatLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Analyze & Suggestions */}
        <div className="space-y-6">
          {/* Analyze */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Health Analysis
            </h3>
            <Button
              onClick={handleAnalyze}
              disabled={analyzeLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white mb-4"
            >
              {analyzeLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                'Analyze My Health Data'
              )}
            </Button>
            {analyzeResult ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {analyzeResult}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                Click the button to generate a health analysis
              </div>
            )}
          </GlassCard>

          {/* Suggestions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Wellness Suggestions
            </h3>
            <Button
              onClick={handleSuggestions}
              disabled={suggestionsLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white mb-4"
            >
              {suggestionsLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </div>
              ) : (
                'Get Wellness Suggestions'
              )}
            </Button>
            {suggestionsResult ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {suggestionsResult}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                Click the button to get personalized wellness suggestions
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Medical Disclaimer */}
      {disclaimer ? (
        <GlassCard className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-300 whitespace-pre-wrap">
              {disclaimer}
            </p>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
};

export default LLMAssistantPage;
