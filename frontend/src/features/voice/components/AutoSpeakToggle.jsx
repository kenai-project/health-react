import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * AutoSpeakToggle — Toggle switch for AI speaking responses aloud
 *
 * @param {Object} props
 * @param {boolean} props.enabled  Current toggle state
 * @param {(enabled: boolean) => void} props.onToggle  Called when toggled
 * @param {boolean} [props.isSpeaking]  Whether speech is currently active
 * @param {() => void} [props.onStop]  Called to stop current speech
 * @param {string} [props.className='']  Additional CSS classes
 */
const AutoSpeakToggle = ({ enabled, onToggle, isSpeaking, onStop, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isSpeaking ? (
        <button
          type="button"
          onClick={onStop}
          title="Stop speaking"
          aria-label="Stop speaking"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
            hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          <VolumeX size={14} />
          <span>Stop</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          title={enabled ? 'Disable auto-speak' : 'Enable auto-speak'}
          aria-label={enabled ? 'Disable auto-speak' : 'Enable auto-speak'}
          aria-pressed={enabled}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${
              enabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <Volume2 size={14} />
          <span>{enabled ? 'Auto-speak ON' : 'Auto-speak OFF'}</span>
        </button>
      )}
    </div>
  );
};

export default AutoSpeakToggle;