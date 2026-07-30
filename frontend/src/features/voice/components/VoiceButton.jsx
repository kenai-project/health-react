import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

/**
 * VoiceButton — Push-to-talk microphone button
 *
 * States:
 *  - idle:       Mic icon, click to start
 *  - listening:  Red pulsing mic, capturing audio
 *  - processing: Spinner, waiting for transcript
 *  - disabled:   Grayed out, AI is responding
 *  - unsupported: Strikethrough mic, browser can't do STT
 *
 * @param {Object} props
 * @param {(transcript: string) => void} props.onTranscript  Called with final transcript
 * @param {boolean} [props.disabled=false]  Disable while AI is responding
 * @param {'sm'|'md'|'lg'} [props.size='md']  Button size
 * @param {string} [props.className='']  Additional CSS classes
 */
const VoiceButton = ({ onTranscript, disabled = false, size = 'md', className = '' }) => {
  const [processing, setProcessing] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
  });

  // When a final transcript arrives, pass it up and reset
  useEffect(() => {
    if (transcript && !isListening && !processing) {
      setProcessing(true);
      // Small delay to let the speech end event settle
      const timer = setTimeout(() => {
        onTranscript(transcript);
        resetTranscript();
        setProcessing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, processing, onTranscript, resetTranscript]);

  // Show error as toast (console for now; caller can watch error prop)
  useEffect(() => {
    if (error) {
      console.warn('VoiceButton error:', error);
    }
  }, [error]);

  const handleClick = useCallback(() => {
    if (disabled || processing) return;

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [disabled, processing, isListening, stopListening, resetTranscript, startListening]);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  // Not supported — show disabled button
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Speech recognition is not supported in this browser"
        aria-label="Speech recognition not supported"
        className={`inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed ${sizeClasses[size]} ${className}`}
      >
        <MicOff size={iconSizes[size]} />
      </button>
    );
  }

  // Disabled state
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title="Wait for AI response before speaking"
        aria-label="Voice input disabled"
        className={`inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed ${sizeClasses[size]} ${className}`}
      >
        <Mic size={iconSizes[size]} />
      </button>
    );
  }

  // Processing state
  if (processing) {
    return (
      <button
        type="button"
        disabled
        title="Processing speech..."
        aria-label="Processing speech"
        className={`inline-flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500 ${sizeClasses[size]} ${className}`}
      >
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isListening ? 'Click to stop recording' : 'Click to speak'}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
      aria-pressed={isListening}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-200
        ${sizeClasses[size]}
        ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110 animate-pulse'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
        }
        ${className}
      `}
    >
      {isListening ? (
        <Mic size={iconSizes[size]} className="text-white" />
      ) : (
        <Mic size={iconSizes[size]} />
      )}
    </button>
  );
};

export default VoiceButton;