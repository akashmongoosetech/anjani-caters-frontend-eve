import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Heart, Briefcase, Sparkles, GlassWater, ChevronDown, Calendar, ArrowRight, HelpCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';
import { getServiceBySlug, getServices, getServiceFAQs } from '../data/getAsyncData';
import { useAsyncData } from '../hooks/useAsyncData';
import LazyImage from '../components/ui/LazyImage';
import RichText, { stripHtml } from '../components/ui/RichText';
import { useLanguage } from '../context/LanguageContext';
import type { ServiceFAQ } from '../types';

export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const { data: service } = useAsyncData(() => getServiceBySlug(slug || '', language), null, [slug, language]);
  const { data: allServices } = useAsyncData(() => getServices(language), [] as any[], [language]);
  const serviceId = service?._id || service?.id || '';
  const { data: serviceFAQs } = useAsyncData(() => getServiceFAQs(serviceId), [] as ServiceFAQ[], [serviceId, language]);

  // Auto scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!service) {
    // ... show loading or not found
  
    return (
      <div className="py-24 text-center bg-cream min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h2 className="font-serif text-3xl font-bold text-secondary">Service Not Found</h2>
        <p className="text-slate-600 font-sans">We couldn't locate the event catering service you requested.</p>
        <Link to="/services" className="bg-primary text-secondary px-6 py-2.5 rounded-full font-bold">
          Back to All Services
        </Link>
      </div>
    );
  }

  // Find related services (excluding the current one), prioritizing same category
  const relatedServices = allServices
    .filter(s => s.id !== service.id)
    .sort((a, b) => {
      const aSame = a.categoryName === service.categoryName ? 0 : 1;
      const bSame = b.categoryName === service.categoryName ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 2);

  const serviceFaqs: ServiceFAQ[] = serviceFAQs || [];

  const faqSchema = serviceFaqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: serviceFaqs.map((faq) => ({
          '@type': 'Question',
          name: stripHtml(faq.question),
          acceptedAnswer: {
            '@type': 'Answer',
            text: stripHtml(faq.answer),
          },
        })),
      }
    : null;

  const breadcrumbs: { name: string; path?: string }[] = [
    { name: t('home'), path: '/' },
    { name: t('services'), path: '/services' },
  ];
  if (service.categorySlug) {
    breadcrumbs.push({ name: service.categoryName || service.category, path: `/services?category=${service.categorySlug}` });
  }
  if (service.subCategorySlug && service.categorySlug) {
    breadcrumbs.push({ name: service.subCategoryName, path: `/services?category=${service.categorySlug}&subcategory=${service.subCategorySlug}` });
  }
  breadcrumbs.push({ name: service.title });

  return (
    <div>
      <SEO 
        title={service.title} 
        description={stripHtml(service.shortDescription)}
        image={service.image}
        urlPath={`/services/${service.slug}`}
      />
      {faqSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        </Helmet>
      )}
      <PageBanner 
        title={service.title} 
        breadcrumbs={breadcrumbs} 
        backgroundImage={service.image}
      />

      {/* Main Detail Body Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Main Details Box - 8 Columns */}
            <div className="lg:col-span-8 flex flex-col gap-8 text-left">
              
              {/* Cover Narrative */}
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-secondary mb-4">
                  Exceptional Culinary Hospitality for {service.title}
                </h2>
                <RichText html={service.shortDescription} className="mb-6" />
              </div>

              {service.image && (
                <div>
                  <h3 className="font-serif text-2xl font-bold text-secondary mb-5">
                    Visual Showcase
                  </h3>
                  <div className="rounded-2xl overflow-hidden shadow-sm">
                    <LazyImage
                      src={service.image}
                      alt={service.title}
                      wrapperClassName="w-full h-72 sm:h-96"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {service.fullDescription && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-50 shadow-sm">
                  <h3 className="font-serif text-2xl font-bold text-secondary mb-5">
                    About This Service
                  </h3>
                  <RichText html={service.fullDescription} />
                </div>
              )}

              {/* Interactive Service FAQ Accordion */}
              {serviceFaqs.length > 0 && (
                <div>
                  <h3 className="font-serif text-2xl font-bold text-secondary mb-5 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    <span>Catering FAQs for {service.title}</span>
                  </h3>
                  <div className="space-y-3">
                    {serviceFaqs.map((faq, idx) => (
                      <div
                        key={faq._id || faq.id || idx}
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                          aria-expanded={activeAccordion === idx}
                          aria-controls={`service-faq-panel-${idx}`}
                          id={`service-faq-trigger-${idx}`}
                          className="w-full flex items-center justify-between p-5 text-left font-serif font-bold text-base sm:text-lg text-secondary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeAccordion === idx ? 'rotate-180 text-primary' : ''}`} />
                        </button>
                        <div
                          id={`service-faq-panel-${idx}`}
                          role="region"
                          aria-labelledby={`service-faq-trigger-${idx}`}
                          className={`transition-all duration-300 overflow-hidden ${
                            activeAccordion === idx ? 'max-h-[40rem] opacity-100 border-t border-slate-50' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="p-5 font-sans text-slate-600 text-xs sm:text-sm leading-relaxed font-medium bg-cream/30">
                            <RichText html={faq.answer} className="prose-p:my-0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Sidebar - 4 Columns */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* CTA Booking Form Teaser Box */}
              <div className="bg-secondary text-white rounded-3xl p-8 border border-white/5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <h3 className="font-serif text-2xl font-bold text-white mb-3">
                  Book {service.title}
                </h3>
                <p className="font-sans text-white/70 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                  We will design a bespoke menu timeline that aligns with your theme.
                </p>
                <Link
                  to="/contact"
                  className="w-full text-center bg-primary hover:bg-primary-hover text-secondary font-sans font-bold py-3.5 rounded-full shadow-md transition-all block"
                >
                  Request Proposal
                </Link>
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-primary/80 tracking-widest block">No obligations</span>
                  <span className="text-[11px] text-white/50 block">Complimentary initial phone consulting</span>
                </div>
              </div>

              {/* Related Services Recommendation Links */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-50 shadow-sm text-left">
                <h4 className="font-serif text-xl font-bold text-secondary border-b border-slate-100 pb-3 mb-5">
                  Other Premium Services
                </h4>
                <div className="flex flex-col gap-4">
                  {relatedServices.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/services/${rel.slug}`}
                      className="group flex gap-4 items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <LazyImage
                          src={rel.image}
                          alt={rel.title}
                          wrapperClassName="w-full h-full"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <span className="font-serif text-sm font-bold text-secondary group-hover:text-primary transition-colors block leading-tight">
                          {rel.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary block mt-0.5">
                          View details
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
