import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '../LanguageContext';
import { Sparkles } from 'lucide-react';

export default function MegaMenu() {
  const { t } = useLanguage();
  const location = useLocation();

  const categories = [
    { id: 'campaigns', label: t('allCampaigns'), link: createPageUrl('ProductList') + '?sale=true', hasIcon: true },
    { id: 'ladies', label: t('ladies'), link: createPageUrl('ProductList') + '?gender=women' },
    { id: 'gentlemen', label: t('gentlemen'), link: createPageUrl('ProductList') + '?gender=men' },
    { id: 'children', label: t('children'), link: createPageUrl('ProductList') + '?gender=kids' },
    { id: 'looks', label: t('looks'), link: createPageUrl('Looks') },
  ];

  const isActive = (link) => {
    return location.pathname + location.search === link;
  };

  return (
    <nav className="flex items-center gap-3 sm:gap-4 lg:gap-8 py-3 overflow-x-auto scrollbar-hide">
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={cat.link}
          className={`elysian-link relative flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-[1.2px] sm:tracking-[1.5px] uppercase whitespace-nowrap py-2 px-1 min-h-[44px] transition-colors ${
            isActive(cat.link)
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-dark)]/80 dark:text-white/80 hover:text-[var(--color-primary)]'
          }`}
        >
          {cat.hasIcon && <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          {cat.label}
        </Link>
      ))}
    </nav>
  );
}