import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Briefcase, Sparkles, GlassWater, ArrowRight, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import PageBanner from '../components/layout/PageBanner';
import SEO from '../components/SEO';
import ScrollReveal from '../components/ScrollReveal';
import { getCategories, getSubCategoriesByCategory, getServicesFiltered } from '../data/getAsyncData';
import type { Service, Category, SubCategory } from '../types';
import LazyImage from '../components/ui/LazyImage';
import RichText from '../components/ui/RichText';
import { useLanguage } from '../context/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';

interface Group {
  label: string;
  subLabel?: string;
  services: Service[];
}

function groupServices(services: Service[], categorySlug: string, subcategorySlug: string): Group[] {
  if (subcategorySlug) {
    return services.length > 0 ? [{ label: 'Services', services }] : [];
  }
  if (categorySlug) {
    // Group the selected category's services by sub-category
    const map = new Map<string, Service[]>();
    services.forEach((s) => {
      const key = s.subCategoryName || 'General';
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([label, list]) => ({ label, services: list }));
  }
  // No filter: group by category, then sub-category
  const catMap = new Map<string, Map<string, Service[]>>();
  services.forEach((s) => {
    const catName = s.categoryName || s.category || 'General';
    const subName = s.subCategoryName || 'All Services';
    if (!catMap.has(catName)) catMap.set(catName, new Map());
    const subMap = catMap.get(catName)!;
    const list = subMap.get(subName) || [];
    list.push(s);
    subMap.set(subName, list);
  });
  const groups: Group[] = [];
  catMap.forEach((subMap, catName) => {
    subMap.forEach((list, subName) => {
      groups.push({ label: subName === 'All Services' ? catName : subName, subLabel: subName === 'All Services' ? undefined : catName, services: list });
    });
  });
  return groups;
}

function iconFor(name: string) {
  if (name === 'Heart') return Heart;
  if (name === 'Briefcase') return Briefcase;
  if (name === 'Sparkles') return Sparkles;
  return GlassWater;
}

export default function Services() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const subcategorySlug = searchParams.get('subcategory') || '';

  const { data: categories } = useAsyncData<Category[]>(() => getCategories(language), [], [language]);

  const selectedCategory: Category | null = categories.find((c) => c.slug === categorySlug) || null;

  const { data: subCategories } = useAsyncData<SubCategory[]>(
    () => (selectedCategory ? getSubCategoriesByCategory(selectedCategory._id) : Promise.resolve([])),
    [],
    [selectedCategory?._id || '']
  );

  const selectedSubCategory: SubCategory | null = subCategories.find((s) => s.slug === subcategorySlug) || null;

  const { data: services, loading, error } = useAsyncData<Service[]>(
    () => getServicesFiltered(categorySlug || undefined, subcategorySlug || undefined),
    [],
    [categorySlug, subcategorySlug]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categorySlug, subcategorySlug]);

  const handleCategoryChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('category', value);
      next.delete('subcategory');
    } else {
      next.delete('category');
      next.delete('subcategory');
    }
    setSearchParams(next, { replace: true });
  };

  const handleSubCategoryChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('subcategory', value);
    else next.delete('subcategory');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    // Reset a sub-category param that does not belong to the selected category
    if (selectedCategory && subCategories.length > 0 && subcategorySlug && !subCategories.some((s) => s.slug === subcategorySlug)) {
      handleSubCategoryChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategories, subcategorySlug]);

  const groups = groupServices(services, categorySlug, subcategorySlug);

  const pageTitle = subcategorySlug
    ? `${selectedSubCategory?.name || selectedCategory?.name || ''} Services`
    : categorySlug
      ? `${selectedCategory?.name || ''} Services`
      : t('servicesTitle');
  const pageDescription =
    (subcategorySlug ? selectedSubCategory?.description : selectedCategory?.description) ||
    t('servicesSubtitle');
  const canonicalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${window.location.pathname}${window.location.search}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: typeof window !== 'undefined' ? window.location.origin : '' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: typeof window !== 'undefined' ? `${window.location.origin}/services` : '' },
      ...(selectedCategory
        ? [{ '@type': 'ListItem' as const, position: 3, name: selectedCategory.name, item: typeof window !== 'undefined' ? `${window.location.origin}/services?category=${selectedCategory.slug}` : '' }]
        : []),
      ...(selectedSubCategory
        ? [{ '@type': 'ListItem' as const, position: selectedCategory ? 4 : 3, name: selectedSubCategory.name, item: typeof window !== 'undefined' ? `${window.location.origin}/services?category=${categorySlug}&subcategory=${subcategorySlug}` : '' }]
        : []),
    ],
  };

  return (
    <div>
      <SEO
        title={pageTitle}
        description={pageDescription}
        urlPath="/services"
        canonicalUrl={canonicalUrl}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <PageBanner
        title={pageTitle}
        breadcrumbs={[
          { name: t('services'), path: '/services' },
          ...(selectedCategory ? [{ name: selectedCategory.name, path: `/services?category=${selectedCategory.slug}` }] : []),
          ...(selectedSubCategory ? [{ name: selectedSubCategory.name }] : []),
        ]}
        backgroundImage="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80"
      />

      {/* Services Grid Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal direction="up" duration={0.7} className="text-center max-w-xl mx-auto mb-12 flex flex-col gap-4">
            <span className="text-primary uppercase tracking-[0.25em] text-xs sm:text-sm font-bold block">
              {t('servicesTitle')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-secondary">
              {t('servicesSubtitle')}
            </h2>
          </ScrollReveal>

          {/* Dynamic Category + Sub-Category Filters */}
          <div className="max-w-5xl mx-auto mb-14 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
                {t('category')}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory?.slug || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">{t('allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
                {t('subCategory')}
              </label>
              <div className="relative">
                <select
                  value={selectedSubCategory?.slug || ''}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50 focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">{t('allSubCategories')}</option>
                  {subCategories.map((s) => (
                    <option key={s._id} value={s.slug}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500 space-y-3">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-semibold">{t('loadingServices')}</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="py-24 text-center text-rose-500 space-y-2">
              <p className="text-sm font-bold">{t('errorLoadingServices')}</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          )}

          {/* Empty / no results state */}
          {!loading && !error && services.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-4">
              <Sparkles className="w-12 h-12 text-slate-300" />
              <p className="text-base font-bold text-slate-600">{t('noServicesFound')}</p>
              <button
                onClick={() => { setSearchParams({}, { replace: true }); }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-secondary font-sans font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-sm transition-all cursor-pointer"
              >
                <span>{t('viewAllServices')}</span>
              </button>
            </div>
          )}

          {/* Grouped Services */}
          {!loading && !error && services.length > 0 && (
            <div className="space-y-16">
              {groups.map((group, gi) => (
                <div key={gi}>
                  {group.subLabel ? (
                    <div className="mb-8 text-center">
                      <span className="text-primary uppercase tracking-[0.25em] text-[11px] font-bold block mb-1">
                        {group.subLabel}
                      </span>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-secondary">{group.label}</h3>
                    </div>
                  ) : (
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-secondary text-center mb-8">{group.label}</h3>
                  )}

                  <ScrollReveal direction="up" staggerChildren={true} stagger={0.15} className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {group.services.map((service) => {
                      const IconComp = iconFor(service.icon);
                      return (
                        <div
                          key={service.id}
                          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group text-left"
                        >
                          <div>
                            <div className="h-64 overflow-hidden relative">
                              <LazyImage
                                src={service.image}
                                alt={service.title}
                                wrapperClassName="w-full h-full"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                              <div className="absolute bottom-4 left-6 bg-secondary text-primary p-4 rounded-2xl shadow-lg">
                                <IconComp className="w-6 h-6" />
                              </div>
                            </div>

                            <div className="p-8 flex flex-col gap-4">
                              <h4 className="font-serif text-2xl font-bold text-secondary group-hover:text-primary transition-colors">
                                {service.title}
                              </h4>
                              <RichText
                                html={service.shortDescription}
                                className="prose-p:my-0 prose-p:text-slate-600 prose-p:text-sm prose-p:leading-relaxed"
                              />
                            </div>
                          </div>

                          <div className="px-8 pb-8 pt-2">
                            <Link
                              to={`/services/${service.slug}`}
                              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-hover text-white font-sans font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-sm transition-all"
                            >
                              <span>{t('readMore')}</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollReveal>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Trust & Guarantee banner */}
      <section className="bg-linen py-16 border-t border-accent/10">
        <ScrollReveal direction="up" className="max-w-4xl mx-auto px-4 text-center flex flex-col gap-5 items-center">
          <span className="text-primary uppercase tracking-[0.25em] text-xs sm:text-sm font-bold">
            {t('servicesTitle')}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-secondary leading-tight max-w-lg">
            {language === 'HI' ? 'हमारी सेवा का वादा' : 'Our Service Promise'}
          </h2>
          <div className="pt-2">
            <Link
              to="/contact"
              className="bg-primary hover:bg-primary-hover text-secondary font-sans font-bold text-sm px-8 py-3.5 rounded-full shadow-md transition-transform"
            >
              {t('contactUs')}
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
