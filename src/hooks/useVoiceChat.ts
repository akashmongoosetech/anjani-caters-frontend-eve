import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SpeechLocale,
  createRecognition,
  detectChunkLocale,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  splitSpokenText,
  stopSpeaking,
} from '../lib/speech';

export type VoiceStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'paused'
  | 'completed'
  | 'error';

export interface VoiceError {
  kind: 'unsupported' | 'mic-blocked' | 'no-speech' | 'recognition' | 'synthesis';
  message: string;
}

interface UseVoiceChatOptions {
  locale: SpeechLocale;
  /** When false, every chunk uses `locale` (resolved language). When true
      (unresolved/hinglish), per-chunk script detection may vary the voice. */
  allowPerChunkVoice?: boolean;
  /** Called once per finalized transcript (never empty, never twice). */
  onFinalTranscript: (text: string) => void;
  onError?: (error: VoiceError) => void;
}

interface SpeakReplyOptions {
  /** Speak only if non-empty after cleaning; error bubbles are never spoken. */
  allowEmpty?: boolean;
}

// idle -> requesting_permission -> listening -> processing -> speaking -> idle
// listening -> idle when cancelled; any active state -> error on failure.
export function useVoiceChat({ locale, allowPerChunkVoice, onFinalTranscript, onError }: UseVoiceChatOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<VoiceError | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speakSessionRef = useRef(0);
  // Active playback queue: ordered chunks + position + per-chunk retry budget.
  const queueRef = useRef<{ chunks: string[]; index: number; retries: number; baseLocale: SpeechLocale } | null>(null);
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const submittedRef = useRef<string | null>(null);
  const statusRef = useRef<VoiceStatus>('idle');
  const localeRef = useRef<SpeechLocale>(locale);
  localeRef.current = locale;

  const callbacksRef = useRef({ onFinalTranscript, onError });
  callbacksRef.current = { onFinalTranscript, onError };
  const perChunkRef = useRef(allowPerChunkVoice);
  perChunkRef.current = allowPerChunkVoice;

  const setStatusBoth = useCallback((next: VoiceStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const fail = useCallback(
    (kind: VoiceError['kind'], message: string) => {
      const err = { kind, message };
      setVoiceError(err);
      setStatusBoth('error');
      callbacksRef.current.onError?.(err);
    },
    [setStatusBoth],
  );

  const teardownRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try {
      rec.abort();
    } catch {}
  }, []);

  const stopPlayback = useCallback(() => {
    speakSessionRef.current += 1; // invalidate pending onend/onerror callbacks
    queueRef.current = null;
    setProgress({ index: 0, total: 0 });
    stopSpeaking();
    if (statusRef.current === 'speaking' || statusRef.current === 'paused') {
      setStatusBoth('idle');
    }
  }, [setStatusBoth]);

  const pausePlayback = useCallback(() => {
    if (statusRef.current !== 'speaking') return;
    try {
      window.speechSynthesis.pause();
      setStatusBoth('paused');
    } catch {}
  }, [setStatusBoth]);

  const resumePlayback = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    try {
      window.speechSynthesis.resume();
      setStatusBoth('speaking');
    } catch {}
  }, [setStatusBoth]);

  const startListening = useCallback(() => {
    if (statusRef.current === 'listening' || statusRef.current === 'processing') return;
    if (!isSpeechRecognitionSupported()) {
      fail('unsupported', 'unsupported');
      return;
    }
    // Never overlap outputs: a new turn cancels previous speech first.
    stopSpeaking();
    speakSessionRef.current += 1;
    teardownRecognition();
    // New turn, new submission budget: the same phrase may legitimately be
    // repeated across turns; only in-turn duplicates are suppressed.
    submittedRef.current = null;
    setVoiceError(null);
    setInterimTranscript('');
    setStatusBoth('requesting_permission');

    let recognition: SpeechRecognitionInstance;
    try {
      recognition = createRecognition(localeRef.current);
    } catch {
      fail('unsupported', 'unsupported');
      return;
    }
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalized = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalized += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim);
      const finalText = finalized.trim();
      if (finalText && submittedRef.current !== finalText) {
        submittedRef.current = finalText;
        setInterimTranscript('');
        callbacksRef.current.onFinalTranscript(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const kind = event.error;
      if (kind === 'aborted') {
        // User-cancelled via stop(): onend below settles to idle.
        return;
      }
      if (kind === 'not-allowed' || kind === 'service-not-allowed') {
        teardownRecognition();
        fail('mic-blocked', 'mic-blocked');
        return;
      }
      if (kind === 'no-speech' || kind === 'audio-capture' || kind === 'network') {
        teardownRecognition();
        fail(kind === 'no-speech' ? 'no-speech' : 'recognition', kind);
        return;
      }
      teardownRecognition();
      fail('recognition', kind || 'recognition');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // A finalized transcript hands off to the parent (processing); a plain
      // end with no result settles back to idle unless an error was recorded.
      if (statusRef.current === 'listening') setStatusBoth('idle');
      setInterimTranscript('');
    };

    try {
      recognition.start();
      setStatusBoth('listening');
    } catch {
      teardownRecognition();
      fail('recognition', 'recognition');
    }
  }, [fail, setStatusBoth, stopSpeaking, teardownRecognition]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      if (statusRef.current === 'listening') setStatusBoth('idle');
      return;
    }
    try {
      rec.stop();
    } catch {
      teardownRecognition();
      setStatusBoth('idle');
    }
  }, [setStatusBoth, teardownRecognition]);

  const markProcessing = useCallback(() => {
    teardownRecognition();
    setInterimTranscript('');
    setStatusBoth('processing');
  }, [setStatusBoth, teardownRecognition]);

  const markIdle = useCallback(() => {
    queueRef.current = null;
    setProgress({ index: 0, total: 0 });
    setInterimTranscript('');
    setStatusBoth('idle');
  }, [setStatusBoth]);

  const speakReply = useCallback(
    (text: string, opts: SpeakReplyOptions = {}) => {
      if (!isSpeechSynthesisSupported()) {
        fail('unsupported', 'synthesis-unsupported');
        return;
      }
      if (!text || !text.trim()) {
        if (!opts.allowEmpty) return;
      }
      // Divide the COMPLETE answer into ordered chunks first — nothing is
      // dropped: splitSpokenText preserves every word (see verifySpokenChunks).
      const chunks = splitSpokenText(text);
      if (chunks.length === 0) return;
      stopSpeaking();
      const session = speakSessionRef.current + 1;
      speakSessionRef.current = session;
      queueRef.current = { chunks, index: 0, retries: 0, baseLocale: localeRef.current };
      setProgress({ index: 0, total: chunks.length });
      setStatusBoth('speaking');
      speakChunk(0, session);
    },
    // speakChunk is ref-stable (defined below via function hoisting-safe ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fail, setStatusBoth],
  );

  // Speaks queueRef chunk i with per-chunk voice; chains via onend only —
  // never queues multiple utterances at once (browser behavior varies).
  const speakChunk = useCallback(
    (index: number, session: number) => {
      const queue = queueRef.current;
      if (!queue || session !== speakSessionRef.current) return; // stale session
      queue.index = index;
      setProgress({ index, total: queue.chunks.length });
      const chunk = queue.chunks[index];
      // Resolved languages stay on one voice (no mid-answer switching);
      // unresolved/hinglish keeps per-chunk script detection as fallback.
      const chunkLocale = perChunkRef.current
        ? detectChunkLocale(chunk, queue.baseLocale)
        : queue.baseLocale;
      speakText(chunk, {
        language: chunkLocale,
        sessionId: session,
        cancelFirst: false, // never cancel mid-queue; only new sessions cancel
        onStart: (sid) => {
          if (sid === speakSessionRef.current && statusRef.current !== 'paused') {
            setStatusBoth('speaking');
          }
        },
        onEnd: (sid) => {
          if (sid !== speakSessionRef.current) return; // stale session
          const q = queueRef.current;
          if (!q) return;
          if (statusRef.current === 'paused') return; // resume() re-fires onend
          if (index + 1 < q.chunks.length) {
            speakChunk(index + 1, session);
          } else {
            queueRef.current = null;
            setProgress({ index: q.chunks.length, total: q.chunks.length });
            setStatusBoth('completed');
          }
        },
        onError: (message, sid) => {
          if (sid !== speakSessionRef.current) return; // stale session
          const q = queueRef.current;
          // User Stop/Replay already moved on: stay silent.
          if (!q || statusRef.current === 'idle') return;
          // 'canceled'/'interrupted' arrive via onEnd path in speakText; any
          // other engine error retries THIS chunk once, then surfaces error
          // (never restarts from chunk 0, never loops forever).
          if (q.retries < 1) {
            q.retries += 1;
            window.setTimeout(() => speakChunk(index, session), 250);
            return;
          }
          queueRef.current = null;
          fail('synthesis', message);
        },
      });
    },
    [fail, setStatusBoth],
  );

  // Full cleanup on unmount: no orphaned recognition, listeners, or speech.
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch {}
      }
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {}
    };
  }, []);

  return {
    status,
    progress,
    interimTranscript,
    voiceError,
    sttSupported: isSpeechRecognitionSupported(),
    ttsSupported: isSpeechSynthesisSupported(),
    startListening,
    stopListening,
    markProcessing,
    markIdle,
    speakReply,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    clearError: useCallback(() => {
      setVoiceError(null);
      if (statusRef.current === 'error') setStatusBoth('idle');
    }, [setStatusBoth]),
  };
}
