import React from 'react';

/**
 * VoiceWaveform — CSS-only audio visualization
 *
 * Shows animated bars when active. No canvas or Web Audio API needed.
 *
 * @param {Object} props
 * @param {boolean} [props.isActive=false]  Show waveform animation
 * @param {string} [props.color]  Bar color (default: theme primary)
 * @param {string} [props.className='']  Additional CSS classes
 */
const VoiceWaveform = ({ isActive = false, color, className = '' }) => {
  const barColor = color || 'bg-red-500';

  return (
    <div
      className={`flex items-center gap-0.5 h-6 ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`
            w-1 rounded-full transition-all duration-150
            ${barColor}
            ${isActive ? 'animate-waveform' : 'h-1.5 opacity-30'}
          `}
          style={{
            height: isActive ? undefined : '6px',
            animationDelay: isActive ? `${index * 0.15}s` : '0s',
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;