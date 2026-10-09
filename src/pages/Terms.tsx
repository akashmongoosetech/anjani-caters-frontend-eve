import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div>
      <SEO title="Terms & Conditions" description="Terms governing use of the Anjani Catering & Events website, inquiries, bookings, accounts, and user content." urlPath="/terms" />
      <PageBanner title="Terms & Conditions" breadcrumbs={[{ name: 'Terms & Conditions' }]} backgroundImage="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80" />
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <p className="text-sm text-slate-500">Last updated: October 2026. Have these terms reviewed by a qualified legal professional before relying on them.</p>
          <h2>Services & inquiries</h2>
          <p>Submitting a contact, booking, calendar, or order form is a request for a quote — not a confirmed reservation. We confirm availability, menu, pricing, and advance/deposit terms by email or phone before any event is scheduled.</p>
          <h2>Accounts</h2>
          <p>Admin accounts are issued to authorized staff only. You are responsible for keeping credentials confidential and for activity under your account. We may suspend accounts for misuse or security reasons.</p>
          <h2>User content</h2>
          <p>By submitting testimonials, comments, or photos you grant us a non-exclusive right to display and moderate them on the site. We may edit or remove content that is unlawful, misleading, or off-topic. Do not upload content you do not own or have permission to share.</p>
          <h2>Payments, changes & cancellations</h2>
          <p>Where deposits/payments apply, amounts, due dates, and refund rules are stated in your written quote/confirmation — see also our Refund & Cancellation Policy. Event changes (date, guests, venue) may affect pricing and availability.</p>
          <h2>Liability & contact</h2>
          <p>We provide menus, galleries, and blog content in good faith; menus and prices may change. To the extent permitted by law, our liability is limited to the services actually paid for. Questions: <a href="mailto:sales@anjanievents.in">sales@anjanievents.in</a>, Chhatarpur, Madhya Pradesh.</p>
        </div>
      </section>
    </div>
  );
}
