import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';

export default function Refund() {
  return (
    <div>
      <SEO title="Refund & Cancellation Policy" description="How date changes, cancellations, deposits, and refunds work for catering bookings and orders." urlPath="/refund" />
      <PageBanner title="Refund & Cancellation" breadcrumbs={[{ name: 'Refund & Cancellation' }]} backgroundImage="https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=1600&q=80" />
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <p className="text-sm text-slate-500">Last updated: October 2026. Your written quote/confirmation prevails over this summary; have it reviewed legally.</p>
          <h2>How it works</h2>
          <ul>
            <li>Quotes state any advance/deposit, balance due dates, and perishable procurement cut-offs.</li>
            <li>Date/guest-count changes are subject to availability and may change pricing; tell us as early as possible.</li>
            <li>Cancellations before procurement typically qualify for a larger refund; perishable or custom-ordered items already purchased are generally non-refundable.</li>
          </ul>
          <h2>Requesting a change</h2>
          <p>Email <a href="mailto:sales@anjanievents.in">sales@anjanievents.in</a> with your booking reference. Approved refunds go to the original payment method within a reasonable time after confirmation.</p>
        </div>
      </section>
    </div>
  );
}
