import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';

export default function Cookies() {
  const clearConsent = () => {
    try {
      localStorage.removeItem('cookie_consent');
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };
  return (
    <div>
      <SEO title="Cookie Policy" description="How Anjani Catering & Events uses cookies, local storage, analytics, and how to manage consent." urlPath="/cookies" />
      <PageBanner title="Cookie Policy" breadcrumbs={[{ name: 'Cookie Policy' }]} backgroundImage="https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=1600&q=80" />
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <p className="text-sm text-slate-500">Last updated: October 2026.</p>
          <h2>What we store</h2>
          <ul>
            <li><strong>Strictly necessary:</strong> admin auth token (localStorage), consent choice (<code>cookie_consent</code>), language (<code>app_language</code>).</li>
            <li><strong>Functional/offline:</strong> chatbot session drafts and inquiry fallbacks so forms survive reloads.</li>
            <li><strong>Analytics (only after you accept):</strong> Google Analytics (G-C1M79F0B9Q) and Tag Manager (GTM-M27HQ7B7) for aggregate traffic measurement.</li>
          </ul>
          <h2>Managing consent</h2>
          <p>Use the cookie banner to Accept or Decline analytics. Declining blocks analytics loading. You can reset your choice anytime:</p>
          <button onClick={clearConsent} className="mt-2 px-4 py-2 rounded bg-secondary text-white text-sm">Reset cookie choice</button>
        </div>
      </section>
    </div>
  );
}
