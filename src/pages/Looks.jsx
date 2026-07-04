import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Looks() {
  const { t } = useLanguage();

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ['looks-page'],
    queryFn: async () => {
      const allLooks = await base44.entities.Look.list('sort_order', 100);
      return allLooks.filter(l => l.is_active);
    }
  });

  // Fetch all bloggers for attribution
  const { data: bloggers = [] } = useQuery({
    queryKey: ['bloggers-list'],
    queryFn: () => base44.entities.Blogger.list()
  });

  // Map bloggers by ID for quick lookup
  const bloggersById = React.useMemo(() => {
    const map = {};
    bloggers.forEach(b => { map[b.id] = b; });
    return map;
  }, [bloggers]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-medium tracking-tight text-gray-900 dark:text-white mb-3 lg:mb-4">
            {t('shopTheLook')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
            {t('looksDescription')}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : looks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base text-gray-600 dark:text-gray-400">
              {t('noLooksAvailable')}
            </p>
          </div>
        ) : (
          <div className="space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            {looks.map((look) => {
              const mainImage = look.images?.[0] || look.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600';
              const blogger = bloggersById[look.blogger_id];

              return (
                <div key={look.id} className="group">
                  <Link
                    to={createPageUrl('LookDetail') + '?id=' + look.id}
                    className="block relative"
                  >
                    <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg mb-3 relative">
                      <img
                        src={mainImage}
                        alt={look.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Blogger Avatar Overlay */}
                      {blogger && (
                        <Link 
                          to={createPageUrl('BloggerProfile') + '?id=' + blogger.id}
                          className="absolute top-3 left-3 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {blogger.profile_image ? (
                            <img 
                              src={blogger.profile_image} 
                              alt={blogger.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform">
                              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                            </div>
                          )}
                        </Link>
                      )}
                    </div>
                  </Link>

                  <Link to={createPageUrl('LookDetail') + '?id=' + look.id}>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                      {look.title}
                    </h3>
                  </Link>

                  {look.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {look.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {look.product_ids?.length || 0} {t('items')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}