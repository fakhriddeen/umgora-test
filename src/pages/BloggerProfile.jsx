import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { useUIState } from '../components/UIStateContext';
import { Instagram, ExternalLink, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BloggerProfile() {
  const { t } = useLanguage();
  const { openLookSidebar } = useUIState();
  const urlParams = new URLSearchParams(window.location.search);
  const bloggerId = urlParams.get('id');
  const [selectedLookIndex, setSelectedLookIndex] = useState(null);

  const { data: blogger, isLoading: bloggerLoading } = useQuery({
    queryKey: ['blogger-profile', bloggerId],
    queryFn: async () => {
      if (!bloggerId) return null;
      const bloggers = await base44.entities.Blogger.filter({ id: bloggerId });
      return bloggers[0] || null;
    },
    enabled: !!bloggerId
  });

  const { data: looks = [], isLoading: looksLoading } = useQuery({
    queryKey: ['blogger-looks', bloggerId],
    queryFn: async () => {
      if (!bloggerId) return [];
      const allLooks = await base44.entities.Look.list('-created_date', 100);
      return allLooks.filter(look => look.blogger_id === bloggerId && look.is_active);
    },
    enabled: !!bloggerId
  });

  if (!bloggerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Blogger not found</p>
          <Link to={createPageUrl('Home')} className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (bloggerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!blogger) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Blogger not found</p>
          <Link to={createPageUrl('Home')} className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Profile Header */}
        <div className="text-center mb-12">
          {/* Avatar */}
          <div className="mb-6">
            {blogger.profile_image ? (
              <img
                src={blogger.profile_image}
                alt={blogger.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto object-cover border-4 border-gray-200 dark:border-gray-800"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto bg-[var(--color-primary)]/20 flex items-center justify-center border-4 border-gray-200 dark:border-gray-800">
                <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-[var(--color-primary)]" />
              </div>
            )}
          </div>

          {/* Name & Badge */}
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 dark:text-white mb-3">
            {blogger.name}
          </h1>
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            UMGORA Blogger
          </Badge>

          {/* Bio */}
          {blogger.bio && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4 font-light">
              {blogger.bio}
            </p>
          )}

          {/* Instagram */}
          {blogger.instagram_handle && (
            <a
              href={`https://instagram.com/${blogger.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[var(--color-primary)] transition-colors"
            >
              <Instagram className="h-4 w-4" />
              @{blogger.instagram_handle}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-xl">{looks.length}</p>
              <p className="text-gray-500 dark:text-gray-400">Looks</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-xl">
                {looks.reduce((sum, look) => sum + (look.views || 0), 0).toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400">Views</p>
            </div>
          </div>
        </div>

        {/* Looks Grid */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">
            Curated Looks
          </h2>

          {looksLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : looks.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">No looks yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Check back soon for curated fashion inspiration
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {looks.map((look, index) => {
                const coverImage = look.images?.[0] || look.image;
                return (
                  <div
                    key={look.id}
                    className="group cursor-pointer"
                    onClick={() => openLookSidebar(look)}
                    onMouseEnter={() => setSelectedLookIndex(index)}
                    onMouseLeave={() => setSelectedLookIndex(null)}
                  >
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3 relative">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={look.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          View Look
                        </Button>
                      </div>

                      {/* Stats Badge */}
                      {(look.views > 0 || look.clicks > 0) && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                          {look.views > 0 && (
                            <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                              {look.views} views
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {look.title}
                    </h3>
                    {look.tags && look.tags.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {look.tags.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back to Looks */}
        <div className="mt-12 text-center">
          <Link to={createPageUrl('Looks')}>
            <Button variant="outline">
              Explore All Looks
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}