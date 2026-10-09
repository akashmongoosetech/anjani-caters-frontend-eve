import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div>
      <SEO title="Privacy Policy" description="How Anjani Catering & Events collects, uses, and protects your personal information across bookings, contact forms, and newsletters." urlPath="/privacy" />
      <PageBanner title="Privacy Policy" breadcrumbs={[{ name: 'Privacy Policy' }]} backgroundImage="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=80" />
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <p className="text-sm text-slate-500">Last updated: October 2026. This is a general disclosure of actual app behavior; have it reviewed by a qualified legal professional.</p>
          <h2>What we collect</h2>
          <ul>
            <li>Contact & booking details you submit: name, email, phone, event date, guest count, venue/city, message, uploaded files (testimonial/blog avatars).</li>
            <li>Newsletter email when you subscribe via the footer form.</li>
            <li>Chatbot conversations (messages you send to plan events) stored to fulfil inquiries.</li>
            <li>Technical data: IP address, device/browser info via server logs, rate-limiting, and analytics (Google Analytics + Tag Manager) where consent is given.</li>
            <li>Admin account data (name, email, mobile) for authentication; stored preferences (language, consent choice) in localStorage.</li>
          </ul>
          <h2>How we use it</h2>
          <ul>
            <li>Respond to inquiries, prepare quotes, manage bookings/orders, moderate testimonials and blog comments.</li>
            <li>Send transactional emails (booking/contact confirmations, password-reset OTPs) via Brevo/SMTP.</li>
            <li>Improve menus, services, and website content; measure aggregate traffic with your consent.</li>
          </ul>
          <h2>Sharing & retention</h2>
          <p>We do not sell personal data. Processors: hosting/database provider, Brevo (email), Google (analytics/tags, only after consent). We retain inquiry records as needed for operations and legal obligations, then delete or anonymize.</p>
          <h2>Your choices</h2>
          <p>Contact <a href="mailto:sales@anjanievents.in">sales@anjanievents.in</a> to request access, correction, or deletion. You can withdraw consent anytime via the cookie banner (clear site storage) — withdrawing does not affect prior lawful processing.</p>
        </div>
      </section>
    </div>
  );
}
