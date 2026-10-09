import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';

export default function Disclaimer() {
  return (
    <div>
      <SEO title="Disclaimer" description="General information disclaimer for menus, galleries, blog content, and third-party links." urlPath="/disclaimer" />
      <PageBanner title="Disclaimer" breadcrumbs={[{ name: 'Disclaimer' }]} backgroundImage="https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=1600&q=80" />
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <p className="text-sm text-slate-500">Last updated: October 2026.</p>
          <p>Website content (menus, packages, galleries, blogs, testimonials) is general information and may change without notice. Final dishes, pricing, and availability are confirmed in your written quote. External links (maps, social, analytics) are governed by their own providers. Nothing here is professional legal, financial, or dietary advice — please ask us for allergen/Jain customization details before ordering.</p>
        </div>
      </section>
    </div>
  );
}
