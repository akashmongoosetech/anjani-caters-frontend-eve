// Visitor location beacon: records one page view per client-side navigation.
// Never calls IPstack from the browser — the backend derives IP + geolocation.
// Skips admin/auth routes, dedupes StrictMode double-effects, never blocks nav.

import { api } from './api';

const SESSION_KEY = 'visitor_session_id';
const SEEN_KEY = 'visitor_seen_paths';
const CONSENT_KEY = 'visitor_tracking_optout';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now().toString(36)}-fallback`;
  }
}

function makeEventId(path: string): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${path.length}`;
}

function isExcluded(path: string): boolean {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/admin-login') ||
    path.startsWith('/admin-signup')
  );
}

function alreadySeen(eventKey: string): boolean {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return false;
    return raw.split('|').includes(eventKey);
  } catch {
    return false;
  }
}

function markSeen(eventKey: string): void {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const list = raw ? raw.split('|') : [];
    list.push(eventKey);
    sessionStorage.setItem(SEEN_KEY, list.slice(-50).join('|'));
  } catch {}
}

export function isTrackingOptedOut(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setTrackingOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(CONSENT_KEY, '1');
    else localStorage.removeItem(CONSENT_KEY);
  } catch {}
}

export async function trackPageView(path: string): Promise<void> {
  try {
    if (!path || isExcluded(path) || isTrackingOptedOut()) return;
    // Dedupe key per path per session-tick: prevents StrictMode/remount doubles
    // without suppressing legitimate repeat visits at different times.
    const tick = Math.floor(Date.now() / 30000);
    const eventKey = `${path}::${tick}`;
    if (alreadySeen(eventKey)) return;
    markSeen(eventKey);

    const payload = {
      pagePath: path.slice(0, 500),
      referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 500) : '',
      sessionId: getSessionId(),
      eventId: makeEventId(path),
      website: '', // honeypot: always empty for real browsers
    };
    // Fire-and-forget: tracking must never break navigation.
    await api.trackVisit(payload);
  } catch {
    // Silently ignore — beacon failures are non-fatal by design.
  }
}
