import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'cookie_consent';

function pushConsent(granted: boolean) {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag?.('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied',
    });
  } catch {}
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
      else if (localStorage.getItem(KEY) === 'accepted') pushConsent(true);
    } catch { setVisible(true); }
  }, []);

  if (!visible) return null;

  const choose = (v: 'accepted' | 'declined') => {
    try { localStorage.setItem(KEY, v); } catch {}
    pushConsent(v === 'accepted');
    setVisible(false);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie consent" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 bg-secondary text-white rounded-xl shadow-2xl p-5 border border-white/10">
      <p className="text-sm font-semibold">We value your privacy</p>
      <p className="text-xs text-white/70 mt-1">We use necessary storage for login/language and, only with your consent, Google Analytics/Tag Manager. See our <Link to="/cookies" className="underline">Cookie Policy</Link>.</p>
      <div className="flex gap-2 mt-4">
        <button onClick={() => choose('declined')} className="flex-1 px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold">Decline</button>
        <button onClick={() => choose('accepted')} className="flex-1 px-3 py-2 rounded bg-primary hover:opacity-90 text-secondary text-xs font-bold">Accept</button>
      </div>
    </div>
  );
}
