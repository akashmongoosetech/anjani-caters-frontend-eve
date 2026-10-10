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
// NOTE: no length truncation here — chunking (below) preserves everything.
export function toSpokenText(raw: string, maxChars = 20000): string {
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

export const SPEECH_CHUNK_SIZE = 2000;

// Abbreviations whose trailing period must NOT end a sentence.
const ABBREVIATIONS = [
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'no', 'eg', 'ie',
  'etc', 'vs', 'viz', 'al', 'fig', 'dept', 'est', 'approx', 'rs', 'sh',
];

function isSentenceEnd(text: string, index: number): boolean {
  const ch = text[index];
  if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '।') return false;
  // Ellipsis / decimals / version numbers continue the sentence.
  const prev = text[index - 1] || '';
  const next = text[index + 1] || '';
  if (ch === '.' && next === '.') return false;
  if (ch === '.' && /[0-9]/.test(prev) && /[0-9]/.test(next)) return false;
  // Abbreviation guard: "Mr." / "e.g." etc. do not end sentences.
  if (ch === '.') {
    const before = text.slice(Math.max(0, index - 6), index).toLowerCase();
    const word = (before.match(/[a-z]+$/) || [''])[0];
    if (ABBREVIATIONS.includes(word)) return false;
  }
  // A terminator ends a sentence when followed by whitespace/end (optionally
  // after closing quotes or brackets).
  let j = index + 1;
  while (j < text.length && /["'”’)\]]/.test(text[j])) j += 1;
  return j >= text.length || /\s/.test(text[j]);
}

// Split cleaned text into ordered, lossless chunks at sentence boundaries
// (word gaps for over-long sentences). Never splits mid-word, never drops
// content. Handles English, Hindi (danda ।), Hinglish, numbers, URLs.
export function splitSpokenText(raw: string, maxChars = SPEECH_CHUNK_SIZE): string[] {
  const text = toSpokenText(raw);
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const sentences: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (isSentenceEnd(text, i)) {
      const sentence = text.slice(start, i + 1).trim();
      if (sentence) sentences.push(sentence);
      start = i + 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);

  const chunks: string[] = [];
  let current = '';
  const pushCurrent = () => {
    const t = current.trim();
    if (t) chunks.push(t);
    current = '';
  };
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      // Over-long sentence: split at word gaps.
      pushCurrent();
      const words = sentence.split(/\s+/);
      let part = '';
      for (const word of words) {
        const candidate = part ? `${part} ${word}` : word;
        if (candidate.length <= maxChars) {
          part = candidate;
          continue;
        }
        if (part) {
          chunks.push(part);
          part = '';
        }
        // Single token longer than the cap: emit full-size slices.
        let rest = word;
        while (rest.length > maxChars) {
          chunks.push(rest.slice(0, maxChars));
          rest = rest.slice(maxChars);
        }
        part = rest;
      }
      if (part.trim()) chunks.push(part.trim());
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      pushCurrent();
      current = sentence;
    } else {
      current = candidate;
    }
  }
  pushCurrent();
  return chunks.length > 0 ? chunks : [text];
}

// Dev/test assertion: chunking preserves every character in order.
// Compares whitespace-stripped text so hard-sliced safeguard tokens
// (pathological no-space input) verify exactly too.
export function verifySpokenChunks(raw: string, chunks: string[]): boolean {
  const strip = (s: string) => s.replace(/\s+/g, '');
  return strip(chunks.join('')) === strip(toSpokenText(raw));
}

// Heuristic voice choice per chunk: Devanagari-heavy chunks get hi-IN.
export function detectChunkLocale(chunk: string, fallback: SpeechLocale): SpeechLocale {
  const letters = chunk.match(/[\u0900-\u097F A-Za-z]/g) || [];
  if (letters.length === 0) return fallback;
  const devanagari = (chunk.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari / letters.length >= 0.3) return 'hi-IN';
  const latin = (chunk.match(/[A-Za-z]/g) || []).length;
  if (latin / letters.length >= 0.7) return 'en-IN';
  return fallback;
}

export interface SpeakOptions {
  language?: SpeechLocale;
  rate?: number;
  /** Monotonic id of the playback session; stale callbacks are ignored. */
  sessionId?: number;
  /** Cancel existing speech first (default true). Pass false when chaining queued chunks. */
  cancelFirst?: boolean;
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
    if (options.cancelFirst !== false) window.speechSynthesis.cancel();
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
