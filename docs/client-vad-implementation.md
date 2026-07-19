# Client-Side VAD Implementation

## Problem
XAI's server VAD doesn't support custom settings. The voice agent interrupts candidates when they pause to think because:
- Server VAD triggers on any pause (~1-1.5s)
- We can't customize `silence_duration_ms`, `threshold`, etc.

## Solution
Use **client-side VAD** with `@ricky0123/vad-web` (Silero VAD for browser):
- Disable XAI server VAD
- Run VAD locally in the browser
- Only trigger XAI response after **our** VAD detects speech end
- Configure silence duration for interview context (2.5-3s instead of 1.4s)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Microphone → Client VAD (@ricky0123/vad-web)            │   │
│  │                                                          │   │
│  │  - Detects speech start → Start buffering audio         │   │
│  │  - Detects speech end (after 2.5s silence) → Send audio │   │
│  │  - redemptionMs: 2500 (configurable for interviews)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ XAI WebSocket (turn_detection: null/disabled)           │   │
│  │                                                          │   │
│  │  - Receives audio chunks as user speaks                 │   │
│  │  - input_audio_buffer.commit → When VAD says "done"     │   │
│  │  - response.create → Trigger AI response                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Configuration

```typescript
const vad = await MicVAD.new({
  // How long to wait after silence before concluding speech (ms)
  // Default: 1400 (too short for interviews)
  // Interview: 2500-3000 (allows thinking pauses)
  redemptionMs: 2500,

  // Speech detection threshold (0-1)
  // Higher = less sensitive to background noise
  positiveSpeechThreshold: 0.6,
  
  // Negative threshold for silence detection
  negativeSpeechThreshold: 0.35,

  // Minimum speech duration to trigger (ms)
  // Prevents accidental triggers from coughs/noise
  minSpeechFrames: 5,

  // Callbacks
  onSpeechStart: () => {
    // User started speaking
    // Start sending audio to XAI
  },
  onSpeechEnd: (audio) => {
    // User finished speaking (after redemptionMs of silence)
    // Commit audio buffer and trigger response
    sendToXAI({ type: "input_audio_buffer.commit" });
    sendToXAI({ type: "response.create" });
  },
});
```

## Implementation Steps

### 1. Install dependencies
```bash
npm install @ricky0123/vad-web onnxruntime-web
```

### 2. Create `use-client-vad.ts` hook
- Initialize MicVAD with interview-tuned settings
- Export `startListening()`, `stopListening()`
- Callbacks for speech start/end

### 3. Modify `use-interview-voice.ts`
- Set `turn_detection: null` to disable server VAD
- Integrate with client VAD callbacks
- Send `response.create` only when client VAD says speech ended

### 4. Add configuration
- Environment variable for `redemptionMs`
- Different defaults for HR (2000ms) vs Technical (2500ms) vs Coding (3000ms)

## Benefits

| Aspect | Server VAD (Current) | Client VAD (New) |
|--------|---------------------|------------------|
| Silence duration | ~1-1.5s (fixed) | 2.5-3s (configurable) |
| Threshold | Unknown | Configurable |
| Interruptions | Frequent | Rare |
| "Mm-hmm" on pauses | Yes | No (won't trigger) |
| Control | None | Full |

## Files to Modify

1. `package.json` - Add dependencies
2. `src/hooks/use-client-vad.ts` - NEW: Client VAD hook
3. `src/hooks/use-interview-voice.ts` - Integrate client VAD
4. `src/hooks/use-interview-audio.ts` - May need updates for VAD integration
5. `src/lib/interview-prompts.ts` - Remove server VAD config

## References

- [@ricky0123/vad-web docs](https://docs.vad.ricky0123.com/)
- [Silero VAD](https://github.com/snakers4/silero-vad)
- XAI engineer confirmation: "The API does not support custom vad settings currently"
