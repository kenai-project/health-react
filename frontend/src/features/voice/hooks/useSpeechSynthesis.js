import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeechSynthesis
 *
 * Wraps the browser SpeechSynthesis API into a React hook.
 * Designed for future replacement: a backend TTS engine (gTTS, Piper) can
 * swap in by implementing the same interface { speak, cancel, isSpeaking,
 * isSupported }.
 *
 * @param {Object} options
 * @param {number} [options.rate=1.0]    Speaking rate (0.1 to 10)
 * @param {number} [options.pitch=1.0]   Voice pitch (0 to 2)
 * @param {SpeechSynthesisVoice|null} [options.voice=null]  Specific voice
 * @returns {{
 *   speak: (text: string) => void,
 *   cancel: () => void,
 *   isSpeaking: boolean,
 *   isSupported: boolean,
 *   pause: () => void,
 *   resume: () => void,
 *   setVoice: (voice: SpeechSynthesisVoice) => void,
 *   setRate: (rate: number) => void,
 *   setPitch: (pitch: number) => void,
 *   voices: SpeechSynthesisVoice[],
 *   selectedVoice: SpeechSynthesisVoice | null,
 * }}
 */
export default function useSpeechSynthesis(options = {}) {
  const { rate: initialRate = 1.0, pitch: initialPitch = 1.0, voice: initialVoice = null } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(initialVoice);
  const [currentRate, setCurrentRate] = useState(initialRate);
  const [currentPitch, setCurrentPitch] = useState(initialPitch);

  const utteranceRef = useRef(null);
  const speakingRef = useRef(false);

  // Detect browser support and load voices
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (!supported) return;

    // Load voices (they may be loaded asynchronously)
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Set default voice to first English voice if none selected
        if (!selectedVoice) {
          const englishVoice = availableVoices.find((v) => v.lang.startsWith('en'));
          if (englishVoice) {
            setSelectedVoice(englishVoice);
          }
        }
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously; listen for the voiceschanged event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setIsSpeaking(false);

      // Split long text into sentences for more natural pauses
      const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

      const speakNext = (index) => {
        if (index >= sentences.length) {
          speakingRef.current = false;
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = currentRate;
        utterance.pitch = currentPitch;

        utterance.onstart = () => {
          speakingRef.current = true;
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          speakNext(index + 1);
        };

        utterance.onerror = (event) => {
          // Don't treat cancel as an error
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.warn('Speech synthesis error:', event.error);
          }
          speakNext(index + 1);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      speakNext(0);
    },
    [isSupported, selectedVoice, currentRate, currentPitch],
  );

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && speakingRef.current) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis && speakingRef.current) {
      window.speechSynthesis.resume();
    }
  }, []);

  const setVoice = useCallback((voice) => {
    setSelectedVoice(voice);
  }, []);

  const setRate = useCallback((rate) => {
    setCurrentRate(Math.max(0.1, Math.min(10, rate)));
  }, []);

  const setPitch = useCallback((pitch) => {
    setCurrentPitch(Math.max(0, Math.min(2, pitch)));
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    pause,
    resume,
    setVoice,
    setRate,
    setPitch,
    voices,
    selectedVoice,
  };
}