// Browser speech helpers (Web Speech API). No dependencies, no network calls.
// Recognition + synthesis are created per use and torn down by the caller.

export type SpeechLocale = 'en-IN' | 'hi-IN';

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

export function createRecognition(locale: SpeechLocale): SpeechRecognitionInstance {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) throw new Error('Speech recognition is not supported in this browser.');
  const recognition = new Ctor();
  recognition.lang = locale;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

// Strip markdown/formatting so the spoken output sounds natural. The chat UI
// keeps rendering the original rich text; only this cleaned copy is spoken.
export function toSpokenText(raw: string, maxChars = 600): string {
  let text = raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/[*_~`>#|-]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxChars) text = text.slice(0, maxChars).trim();
  return text;
}

export interface SpeakOptions {
  language?: SpeechLocale;
  rate?: number;
  /** Monotonic id of the playback session; stale callbacks are ignored. */
  sessionId?: number;
  onStart?: (sessionId?: number) => void;
  onEnd?: (sessionId?: number) => void;
  onError?: (error: string, sessionId?: number) => void;
}

function pickVoice(locale: SpeechLocale): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const lang = locale.toLowerCase();
    const prefix = lang.split('-')[0];
    return (
      voices.find((v) => v.lang?.toLowerCase() === lang && v.localService) ||
      voices.find((v) => v.lang?.toLowerCase() === lang) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(prefix) && v.localService) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
      null
    );
  } catch {
    return null;
  }
}

export function speakText(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.('Speech synthesis is unavailable in this browser.', options.sessionId);
    return;
  }
  const cleanText = toSpokenText(text);
  if (!cleanText) {
    options.onError?.('There is no text to speak.', options.sessionId);
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {}
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = options.language || 'en-IN';
  utterance.rate = options.rate ?? 1;
  utterance.pitch = 1;
  const voice = pickVoice(utterance.lang as SpeechLocale);
  if (voice) utterance.voice = voice;
  const sid = options.sessionId;
  utterance.onstart = () => options.onStart?.(sid);
  utterance.onend = () => options.onEnd?.(sid);
  utterance.onerror = (event) => {
    const err = (event as SpeechSynthesisErrorEvent).error;
    if (err !== 'canceled' && err !== 'interrupted') options.onError?.(err || 'speech-error', sid);
    else options.onEnd?.(sid);
  };
  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    options.onError?.('Speech synthesis failed to start.', sid);
  }
}

export function stopSpeaking(): void {
  try {
    if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  } catch {}
}
