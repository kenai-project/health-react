import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeechRecognition
 *
 * Wraps the browser Web Speech API (SpeechRecognition) into a React hook.
 * Designed for future replacement: a backend Whisper-based recognizer can
 * swap in by implementing the same interface { startListening, stopListening,
 * isListening, isSupported, transcript, interimTranscript, error }.
 *
 * @param {Object} options
 * @param {string}  [options.language='en-US']  BCP 47 language tag
 * @param {boolean} [options.continuous=false]  Keep listening after first result
 * @param {boolean} [options.interimResults=true] Return partial results
 * @returns {{
 *   isListening: boolean,
 *   isSupported: boolean,
 *   transcript: string,
 *   interimTranscript: string,
 *   startListening: () => void,
 *   stopListening: () => void,
 *   resetTranscript: () => void,
 *   error: string | null,
 * }}
 */
export default function useSpeechRecognition(options = {}) {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Detect browser support once on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore abort errors on unmount
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Abort any existing session before starting a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current +=
          (finalTranscriptRef.current ? ' ' : '') + final;
        setTranscript(finalTranscriptRef.current);
      }

      if (interim) {
        setInterimTranscript(interim);
      } else {
        setInterimTranscript('');
      }

      // If not continuous, stop listening after first final result
      if (!continuous && final) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // No speech detected — this is common, don't treat as hard error
        return;
      }
      if (event.error === 'aborted') {
        // User or component stopped — ignore
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onspeechend = () => {
      // If continuous, don't stop; the onend handler will fire when recognition
      // actually stops.
      if (!continuous) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      recognitionRef.current = recognition;
    } catch (err) {
      setError(`Failed to start speech recognition: ${err.message}`);
      setIsListening(false);
    }
  }, [language, continuous, interimResults]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}