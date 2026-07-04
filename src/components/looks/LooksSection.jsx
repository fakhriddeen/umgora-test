import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useUIState } from '../UIStateContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

export default function LooksSection() {
  const { openLookSidebar } = useUIState();

  const { data: looks = [] } = useQuery({
    queryKey: ['looks'],
    queryFn: async () => {
      const allLooks = await base44.entities.Look.list('sort_order', 50);
      return allLooks.filter(l => l.is_active);
    }
  });

  const { data: bloggers = [] } = useQuery({
    queryKey: ['bloggers-list'],
    queryFn: () => base44.entities.Blogger.list()
  });

  const bloggersById = React.useMemo(() => {
    const map = {};
    bloggers.forEach(b => { map[b.id] = b; });
    return map;
  }, [bloggers]);

  if (looks.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
          Shop The Look
        </h2>
        <Link to={createPageUrl('Looks')}>
          <Button variant="outline" className="font-light">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {looks.slice(0, 3).map((look) => {
          const mainImage = look.images?.[0] || look.image;
          const blogger = bloggersById[look.blogger_id];
          return (
            <div key={look.id} className="group">
              <Link to={createPageUrl('LookDetail') + '?id=' + look.id} className="block relative">
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg mb-3 relative">
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

              <div className="flex items-center justify-between">
                <Link to={createPageUrl('LookDetail') + '?id=' + look.id}>
                  <h3 className="text-lg font-light text-gray-900 dark:text-white hover:text-[var(--color-primary)] transition-colors">
                    {look.title}
                  </h3>
                </Link>
                <Button
                  onClick={() => openLookSidebar(look)}
                  className="font-light"
                  size="sm"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Shop
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}