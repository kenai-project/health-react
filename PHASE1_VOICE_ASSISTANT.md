# Phase 1: Voice Assistant — Architecture & Design

> **Status**: Design Document (Pre-Implementation)  
> **Date**: 2026-07-30  
> **Scope**: Speech-to-Text, Text-to-Speech, Voice Conversation, Push-to-Talk

---

## Design Philosophy

Phase 1 uses **browser-native APIs exclusively** for voice. No new backend endpoints, no new Python dependencies, no new database tables, no new Ollama models. The existing `/llm/chat` endpoint handles all conversation logic — voice input is simply transcribed to text before being sent to the LLM.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React)                             │
│                                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐   │
│  │  Web Speech API     │    │  Speech Synthesis API            │   │
│  │  (SpeechRecognition)│    │  (SpeechSynthesis)               │   │
│  │                     │    │                                  │   │
│  │  Audio → Text       │    │  Text → Audio (speak aloud)     │   │
│  └─────────┬───────────┘    └────────▲─────────────────────────┘   │
│            │                         │                              │
│            ▼ text                     │ audio                       │
│  ┌────────────────────────────────────┴──────┐                      │
│  │         useSpeechRecognition hook          │                      │
│  │         useSpeechSynthesis hook            │                      │
│  └─────────────────────┬──────────────────────┘                      │
│                        │ text                                       │
│  ┌─────────────────────▼──────────────────────┐                      │
│  │         LLMAssistantPage (enhanced)         │                      │
│  │                                            │                      │
│  │  - VoiceButton (push-to-talk)              │                      │
│  │  - VoiceWaveform (visual feedback)         │                      │
│  │  - Auto-speak toggle for AI responses      │                      │
│  └─────────────────────┬──────────────────────┘                      │
│                        │ text (via fetch)                            │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (unchanged)                       │
│                                                                     │
│  POST /llm/chat  ←  receives transcribed text, returns AI reply     │
│                                                                     │
│  No new endpoints needed.                                           │
│  No new services needed.                                            │
│  No new dependencies needed.                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Decision: Why No Backend Changes?

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Browser STT** (Web Speech API) | Zero deps, real-time, free | Chrome/Edge only, requires mic permission | ✅ **Primary** |
| **Backend Whisper** (Ollama) | Works in all browsers, higher accuracy | Requires Whisper model (~1.5GB), network latency | ⏸️ Future option |
| **Browser TTS** (Speech Synthesis) | Zero deps, instant, free | Voice quality varies by OS | ✅ **Primary** |
| **Backend TTS** (gTTS/Piper) | Consistent voice quality | Requires internet (gTTS) or large model (Piper) | ⏸️ Future option |

**Phase 1 uses browser-native APIs.** Backend voice processing (Whisper, gTTS) is deferred to a future phase if needed.

---

## 2. Files to Create

### 2.1 `frontend/src/features/voice/hooks/useSpeechRecognition.js`

**Purpose**: Wraps the browser `SpeechRecognition` API (Web Speech API) into a clean React hook.

**API Design**:
```jsx
const {
  isListening,      // boolean — mic is actively listening
  isSupported,      // boolean — browser supports SpeechRecognition
  transcript,       // string — current partial/final transcript
  interimTranscript,// string — partial transcript (while speaking)
  startListening,   // () => void — start mic
  stopListening,    // () => void — stop mic
  resetTranscript,  // () => void — clear transcript
  error,            // string | null — error message if any
  browserInfo,      // { name, version } — for debugging
} = useSpeechRecognition({ 
  language: 'en-US',     // BCP 47 language tag
  continuous: false,     // stop after first utterance
  interimResults: true,  // show partial results
});
```

**Key Behaviors**:
- Requests microphone permission on first use
- Returns partial results in real-time (interimTranscript)
- Returns final result when user pauses (transcript)
- Handles browser compatibility (Chrome/Edge/Safari have different implementations)
- Cleans up on unmount (stops listening, removes event listeners)
- Reports errors (permission denied, no mic, browser not supported)

**Browser Support**:
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 33+ | ✅ Full | Best support |
| Edge 79+ | ✅ Full | Chromium-based |
| Safari 14.1+ | ⚠️ Partial | Requires `webkitSpeechRecognition` |
| Firefox | ❌ Not supported | Shows unsupported message |
| Samsung Internet | ✅ Full | Chromium-based |

### 2.2 `frontend/src/features/voice/hooks/useSpeechSynthesis.js`

**Purpose**: Wraps the browser `SpeechSynthesis` API into a clean React hook.

**API Design**:
```jsx
const {
  speak,            // (text: string) => void — speak the text
  cancel,           // () => void — stop speaking
  isSpeaking,       // boolean — currently speaking
  isSupported,      // boolean — browser supports SpeechSynthesis
  pause,            // () => void — pause speech
  resume,           // () => void — resume speech
  setVoice,         // (voice: SpeechSynthesisVoice) => void
  setRate,          // (rate: number) => void — 0.1 to 10
  setPitch,         // (pitch: number) => void — 0 to 2
  voices,           // SpeechSynthesisVoice[] — available voices
  selectedVoice,    // SpeechSynthesisVoice | null
} = useSpeechSynthesis({
  rate: 1.0,        // speaking speed
  pitch: 1.0,       // voice pitch
  voice: null,      // specific voice (null = default)
});
```

**Key Behaviors**:
- Queues text and speaks sequentially
- Splits long text into sentences for natural pauses
- Handles the Chrome SpeechSynthesis bug (voices not loaded on page load)
- Cleans up on unmount (cancels any ongoing speech)
- Returns list of available voices for user selection

### 2.3 `frontend/src/features/voice/components/VoiceButton.jsx`

**Purpose**: Push-to-talk microphone button with visual states.

**Props**:
```jsx
VoiceButton.propTypes = {
  onTranscript: PropTypes.func.isRequired,  // called with final transcript
  disabled: PropTypes.bool,                  // disabled while AI is responding
  size: PropTypes.oneOf(['sm', 'md', 'lg']), // button size
  className: PropTypes.string,               // additional CSS classes
};
```

**States**:
| State | Visual | Behavior |
|-------|--------|----------|
| **Idle** | 🎤 Mic icon, gray | Click to start listening |
| **Listening** | 🎤 Mic icon, red pulsing + ripple animation | Capturing audio, showing interim results |
| **Processing** | ⏳ Spinner | Audio captured, waiting for transcript |
| **Disabled** | 🎤 Mic icon, gray, faded | AI is responding, cannot interrupt |
| **Unsupported** | 🎤 Mic icon, gray, strikethrough | Browser doesn't support SpeechRecognition |

**Layout**:
```
┌─────────────────────────────────────────────┐
│  [🎤]  Click to speak — or type your message │
│         ┌─────────────────────────────┐      │
│         │  (interim transcript...)    │      │  ← shown only when listening
│         └─────────────────────────────┘      │
└─────────────────────────────────────────────┘
```

### 2.4 `frontend/src/features/voice/components/VoiceWaveform.jsx`

**Purpose**: Audio visualization while recording (optional aesthetic enhancement).

**Props**:
```jsx
VoiceWaveform.propTypes = {
  isActive: PropTypes.bool,  // show waveform animation
  color: PropTypes.string,   // bar color (default: theme primary)
};
```

**Implementation**: CSS-only animated bars (no canvas/Web Audio API needed for Phase 1). Simple 5-bar equalizer animation using CSS keyframes.

### 2.5 `frontend/src/features/voice/components/AutoSpeakToggle.jsx`

**Purpose**: Toggle switch to enable/disable AI speaking responses aloud.

**Props**:
```jsx
AutoSpeakToggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
```

**Behavior**:
- When enabled, AI responses are automatically spoken via SpeechSynthesis
- When disabled, AI responses are text-only (current behavior)
- State persisted in localStorage

---

## 3. Files to Modify

### 3.1 `frontend/src/app/pages/LLMAssistantPage.jsx` — MODIFIED

**Changes**:
1. Import `VoiceButton` and `AutoSpeakToggle`
2. Import `useSpeechSynthesis` hook
3. Add voice button next to the chat input
4. When voice transcript is received, auto-fill the input and optionally auto-send
5. Add auto-speak toggle in the header area
6. When AI response arrives and auto-speak is enabled, call `speak(response.reply)`
7. Disable voice button while AI is loading
8. Stop speaking when user sends a new message

**Modified sections**:
- **Imports**: Add VoiceButton, AutoSpeakToggle, useSpeechSynthesis
- **State**: Add `autoSpeakEnabled` (from localStorage)
- **Input area**: Add VoiceButton beside the Send button
- **Header area**: Add AutoSpeakToggle
- **Response handler**: After receiving AI reply, optionally speak it
- **Send handler**: Cancel any ongoing speech when user sends

### 3.2 `frontend/src/app/services/api.js` — NO CHANGES NEEDED

The existing `llmService.chat()` method already accepts text and returns text. Voice input is transcribed to text before calling this method. No API changes required.

### 3.3 `frontend/src/app/routes.jsx` — NO CHANGES NEEDED

Voice is integrated into the existing `/llm` route. No new routes needed.

### 3.4 `frontend/src/app/components/Sidebar.jsx` — NO CHANGES NEEDED

The existing "AI Assistant" nav item already points to `/llm`. No new nav items needed.

### 3.5 `frontend/src/app/components/Header.jsx` — OPTIONAL MINOR CHANGE

Optionally add a small mic icon in the header for quick access, but this is not required for Phase 1. Voice is accessed from within the LLM Assistant page.

### 3.6 `backend/` — NO CHANGES NEEDED

No backend changes required for Phase 1. The existing `/llm/chat` endpoint handles everything.

---

## 4. Data Flow

### 4.1 Voice Input Flow

```
User presses 🎤 button
    │
    ▼
VoiceButton calls startListening()
    │
    ▼
Browser shows mic permission dialog (first time only)
    │
    ▼
User speaks: "What is my average weight this month?"
    │
    ▼
Web Speech API streams interim results in real-time
    │  (shown in a floating bubble above the input)
    ▼
User stops speaking (pause > 1 second)
    │
    ▼
Web Speech API fires 'result' event with final transcript
    │
    ▼
VoiceButton calls onTranscript("What is my average weight this month?")
    │
    ▼
LLMAssistantPage receives transcript, sets it as input value
    │
    ▼
LLMAssistantPage auto-submits the message (or user presses Send)
    │
    ▼
Existing chat flow: POST /llm/chat → receive AI reply → display
    │
    ▼
If auto-speak enabled → speak AI reply aloud
```

### 4.2 Voice Output Flow

```
AI reply received from /llm/chat
    │
    ▼
If autoSpeakEnabled === true:
    │
    ▼
useSpeechSynthesis.speak(reply)
    │
    ▼
Browser SpeechSynthesis speaks the text aloud
    │
    ▼
VoiceWaveform shows speaking animation (optional)
    │
    ▼
When speech ends → cleanup, enable voice button again
```

---

## 5. Component Integration

### 5.1 LLMAssistantPage Layout Changes

```
┌──────────────────────────────────────────────────────────────┐
│  AI Health Assistant                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  LLM Health Status                                     │  │
│  │  [🟢 Ollama is running]                    [🔄 Refresh]│  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────┐ ┌────────────────────────┐ │
│  │  Chat with AI Assistant      │ │  [🔊 Auto-speak]      │ │
│  │                              │ │  Toggle on/off        │ │
│  │  ┌────────────────────────┐  │ │                        │ │
│  │  │ User message           │  │ │  Health Analysis       │ │
│  │  └────────────────────────┘  │ │  [Analyze My Health]   │ │
│  │  ┌────────────────────────┐  │ │                        │ │
│  │  │ AI response            │  │ │  Wellness Suggestions  │ │
│  │  └────────────────────────┘  │ │  [Get Suggestions]     │ │
│  │                              │ │                        │ │
│  │  ┌────────────────────────┐  │ └────────────────────────┘ │
│  │  │ [Type message...] [🎤] │  │                            │
│  │  │              [Send]    │  │                            │
│  │  └────────────────────────┘  │                            │
│  └──────────────────────────────┘                            │
│                                                              │
│  ⚠️ Medical Disclaimer                                       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 State Changes in LLMAssistantPage

```jsx
// New state
const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(() => {
  return localStorage.getItem('autoSpeak') === 'true';
});

// New hooks
const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis({
  rate: 1.0,
  pitch: 1.0,
});

// Voice transcript handler
const handleVoiceTranscript = (transcript) => {
  setChatInput(transcript);
  // Auto-send after a short delay (user can also press Send manually)
  setTimeout(() => {
    if (transcript.trim()) {
      handleSendMessage(transcript);
    }
  }, 500);
};

// Modified send handler — cancel any ongoing speech
const handleSendMessage = async (overrideMessage) => {
  if (isSpeaking) cancelSpeech();
  // ... existing logic ...
};

// Modified response handler — speak AI reply
// After setting assistant message:
if (autoSpeakEnabled && response.reply) {
  speak(response.reply);
}
```

---

## 6. Browser Compatibility Strategy

| Scenario | Handling |
|----------|----------|
| **Chrome/Edge** | Full support via `SpeechRecognition` + `SpeechSynthesis` |
| **Safari** | Uses `webkitSpeechRecognition` prefix; SpeechSynthesis works |
| **Firefox** | Shows "Voice not supported in this browser" tooltip on mic button |
| **Mobile Chrome** | Full support; mic permission dialog appears |
| **Mobile Safari** | Partial support; may require user gesture to start |
| **Permission denied** | Shows error toast: "Microphone access denied. Please allow mic access in browser settings." |
| **No microphone** | Shows "No microphone detected" tooltip |

The `useSpeechRecognition` hook detects support and sets `isSupported` accordingly. The `VoiceButton` component uses this to show appropriate UI.

---

## 7. Testing Strategy

| Test | How |
|------|-----|
| **Browser support detection** | Open in Chrome, Edge, Safari, Firefox — verify correct UI |
| **Mic permission** | First click shows permission dialog; accept/deny both handled |
| **STT accuracy** | Speak various health-related phrases; verify transcription |
| **Auto-send** | Speak a message; verify it auto-sends after pause |
| **TTS playback** | Enable auto-speak; verify AI response is spoken |
| **Interrupt TTS** | Send new message while AI is speaking; verify speech stops |
| **Voice + text hybrid** | Type a message, then use voice; verify both work |
| **Error recovery** | Deny mic permission; verify graceful error + retry |
| **Mobile** | Test on Android Chrome, iOS Safari |
| **Existing functionality** | Verify text-only chat still works identically |

---

## 8. Files Summary

### New Files (5)

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/src/features/voice/hooks/useSpeechRecognition.js` | Browser STT hook |
| 2 | `frontend/src/features/voice/hooks/useSpeechSynthesis.js` | Browser TTS hook |
| 3 | `frontend/src/features/voice/components/VoiceButton.jsx` | Push-to-talk mic button |
| 4 | `frontend/src/features/voice/components/VoiceWaveform.jsx` | Audio visualization |
| 5 | `frontend/src/features/voice/components/AutoSpeakToggle.jsx` | TTS enable/disable |

### Modified Files (1)

| # | File | Changes |
|---|------|---------|
| 1 | `frontend/src/app/pages/LLMAssistantPage.jsx` | Add voice button, auto-speak toggle, speech hooks |

### Unchanged Files (0 changes needed)

| File | Reason |
|------|--------|
| `backend/api/routes/llm.py` | No backend changes needed |
| `backend/services/llm_service.py` | No backend changes needed |
| `backend/api/main.py` | No new routes to register |
| `backend/requirements.txt` | No new dependencies |
| `frontend/src/app/services/api.js` | Existing chat API unchanged |
| `frontend/src/app/routes.jsx` | No new routes |
| `frontend/src/app/components/Sidebar.jsx` | Existing nav item unchanged |
| `frontend/src/app/components/Header.jsx` | Optional future enhancement |
| `frontend/package.json` | No new dependencies |
| `backend/db/models.py` | No new tables |
| `backend/db/migrate.py` | No new migrations |

---

## 9. Implementation Order

```
Step 1: Create useSpeechRecognition.js hook
Step 2: Create useSpeechSynthesis.js hook
Step 3: Create VoiceButton.jsx component
Step 4: Create VoiceWaveform.jsx component
Step 5: Create AutoSpeakToggle.jsx component
Step 6: Modify LLMAssistantPage.jsx to integrate voice
Step 7: Test all voice flows
Step 8: Test existing text-only flow still works
```

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Browser STT not supported | Medium (Firefox) | Low | Show unsupported message; text input still works |
| STT accuracy poor | Medium | Low | User can edit transcript before sending |
| Mic permission denied | Low | Low | Show error toast; text input still works |
| TTS voice quality poor | Medium | Low | User can disable auto-speak |
| Regression in existing chat | Low | High | Test text-only flow after changes |
| Mobile compatibility | Medium | Medium | Test on Android Chrome, iOS Safari |

**Overall Phase 1 Risk**: 🟢 **Low** — No backend changes, no new dependencies, no database changes, existing functionality preserved.

---

## 11. Approval Checklist

Before implementation begins, confirm:

- [ ] Architecture design approved
- [ ] All 5 new files identified
- [ ] All 1 modified file identified
- [ ] No backend changes required
- [ ] No new dependencies required
- [ ] No database changes required
- [ ] Existing functionality preserved
- [ ] Browser compatibility strategy defined
- [ ] Testing strategy defined