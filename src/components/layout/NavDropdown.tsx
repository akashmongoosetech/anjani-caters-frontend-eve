import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ArrowRight, 
  Package, 
  Briefcase, 
  BookOpen, 
  Users, 
  Star, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { NavItem, isPathActive, isDropdownActive } from '../../data/navigation';
import { useLanguage } from '../../context/LanguageContext';

interface NavDropdownProps {
  item: NavItem;
}

const iconMap: Record<string, React.ElementType> = {
  Package,
  Briefcase,
  BookOpen,
  Users,
  Star,
  HelpCircle,
};

export default function NavDropdown({ item }: NavDropdownProps) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const dropdownItems = item.dropdown || [];
  const isActive = isDropdownActive(pathname, dropdownItems);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation and Escape listener
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleKeyDownOnTrigger = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => {
        menuItemsRef.current[0]?.focus();
      }, 50);
    }
  };

  const handleKeyDownOnItem = (e: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % dropdownItems.length;
      menuItemsRef.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + dropdownItems.length) % dropdownItems.length;
      menuItemsRef.current[prevIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative py-2 group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDownOnTrigger}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${t(item.nameKey)} menu`}
        className={`flex items-center gap-1.5 font-sans font-medium text-sm transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary rounded-md px-1 py-0.5 cursor-pointer ${
          isActive || isOpen ? 'text-primary font-semibold' : 'text-white/90 hover:text-primary'
        }`}
      >
        <span>{t(item.nameKey)}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-primary' : 'text-white/70 group-hover:text-primary'
          }`}
        />
        {/* Active Underline Indicator */}
        <span
          className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
            isActive ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      </button>

      {/* Floating Modern Mega Menu Card */}
      <div
        role="menu"
        aria-orientation="vertical"
        aria-label={`${t(item.nameKey)} sub-menu`}
        className={`absolute -left-12 sm:left-0 mt-3 w-[340px] sm:w-[560px] bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-100 transition-all duration-300 transform origin-top-left z-50 ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 visible'
            : 'opacity-0 -translate-y-2 scale-95 invisible pointer-events-none'
        }`}
      >
        {/* Arrow indicator */}
        <div className="absolute -top-1.5 left-16 sm:left-10 w-3 h-3 bg-white rotate-45 border-t border-l border-slate-100 rounded-tl-sm pointer-events-none" />

        {/* Mega Menu Header Banner */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-serif text-xs font-bold uppercase tracking-widest text-secondary">
              Explore Anjani Experience
            </span>
          </div>
          <span className="text-[10px] font-sans font-semibold text-slate-400 bg-cream px-2 py-0.5 rounded-full">
            Bespoke Services
          </span>
        </div>

        {/* Grid of Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {dropdownItems.map((subItem, idx) => {
            const isSubActive = isPathActive(pathname, subItem.path);
            const IconComponent = subItem.icon && iconMap[subItem.icon] ? iconMap[subItem.icon] : Package;
            const isFeatured = subItem.featured;

            return (
              <Link
                key={subItem.id}
                ref={(el) => {
                  menuItemsRef.current[idx] = el;
                }}
                to={subItem.path}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => handleKeyDownOnItem(e, idx)}
                className={`group/card flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isFeatured
                    ? 'sm:col-span-2 bg-gradient-to-r from-primary/10 via-cream/60 to-white border border-primary/30 shadow-xs hover:shadow-md'
                    : isSubActive
                    ? 'bg-primary/10 border border-primary/20 shadow-xs'
                    : 'bg-cream/40 hover:bg-cream border border-transparent hover:border-slate-100 shadow-2xs'
                }`}
              >
                {/* Icon Box */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/card:scale-110 ${
                    isFeatured
                      ? 'bg-primary text-secondary shadow-md'
                      : isSubActive
                      ? 'bg-primary text-secondary'
                      : 'bg-white text-primary shadow-sm border border-slate-100 group-hover/card:bg-primary group-hover/card:text-secondary'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-serif text-sm font-bold transition-colors ${
                        isSubActive || isFeatured ? 'text-secondary font-extrabold' : 'text-secondary group-hover/card:text-primary'
                      }`}
                    >
                      {t(subItem.nameKey)}
                    </span>
                    {isFeatured && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-primary text-secondary px-2 py-0.5 rounded-full shadow-2xs">
                        Popular
                      </span>
                    )}
                    {isSubActive && !isFeatured && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  {subItem.desc && (
                    <p className="font-sans text-[11px] text-slate-500 leading-snug line-clamp-1">
                      {subItem.desc}
                    </p>
                  )}
                </div>

                {/* Arrow on hover for featured */}
                {isFeatured && (
                  <div className="self-center pl-1 text-primary transition-transform duration-300 group-hover/card:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
