import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { useUIState } from '../components/UIStateContext';
import { useLookReferral } from '../components/LookReferralContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingBag, ZoomIn, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function LookDetail() {
  const { t } = useLanguage();
  const { openLookSidebar } = useUIState();
  const { setLookReferral } = useLookReferral();
  const urlParams = new URLSearchParams(window.location.search);
  const lookId = urlParams.get('id');
  const refBloggerId = urlParams.get('ref');

  // Set look referral on first visit with ref param
  useEffect(() => {
    if (lookId && refBloggerId) {
      setLookReferral(lookId, refBloggerId);
    }
  }, [lookId, refBloggerId, setLookReferral]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [imageTransition, setImageTransition] = useState(false);

  const { data: look, isLoading } = useQuery({
    queryKey: ['look', lookId],
    queryFn: async () => {
      const looks = await base44.entities.Look.filter({ id: lookId });
      return looks[0] || null;
    },
    enabled: !!lookId
  });

  const { data: relatedLooks = [] } = useQuery({
    queryKey: ['related-looks', lookId],
    queryFn: async () => {
      const allLooks = await base44.entities.Look.list('sort_order', 10);
      return allLooks.filter(l => l.is_active && l.id !== lookId).slice(0, 3);
    },
    enabled: !!lookId
  });

  // Fetch blogger info
  const { data: blogger } = useQuery({
    queryKey: ['look-blogger', look?.blogger_id],
    queryFn: async () => {
      if (!look?.blogger_id) return null;
      const bloggers = await base44.entities.Blogger.filter({ id: look.blogger_id });
      return bloggers[0] || null;
    },
    enabled: !!look?.blogger_id
  });

  // Increment view count on visit
  useEffect(() => {
    if (look?.id) {
      base44.entities.Look.update(look.id, { 
        views: (look.views || 0) + 1 
      }).catch(() => {});
    }
  }, [look?.id]);

  const images = look?.images?.length ? look.images : (look?.image ? [look.image] : []);

  const handlePrevImage = () => {
    setImageTransition(true);
    setTimeout(() => {
      setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
      setTimeout(() => setImageTransition(false), 50);
    }, 150);
  };

  const handleNextImage = () => {
    setImageTransition(true);
    setTimeout(() => {
      setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
      setTimeout(() => setImageTransition(false), 50);
    }, 150);
  };

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
    setTouchStart(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  if (!look) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('lookNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          to={createPageUrl('Looks')}
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('backToLooks')}
        </Link>

        {/* Main Image - Full width centered */}
        <div className="mb-8">
          <div 
            className="aspect-[3/4] max-w-2xl mx-auto bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg relative group cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {images[selectedImage] && (
              <img
                src={images[selectedImage]}
                alt={look.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageTransition ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            
            {/* Blogger Avatar Overlay */}
            {blogger && (
              <Link 
                to={createPageUrl('BloggerProfile') + '?id=' + blogger.id}
                className="absolute top-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {blogger.profile_image ? (
                  <img 
                    src={blogger.profile_image} 
                    alt={blogger.name}
                    className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-xl hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center border-3 border-white shadow-xl hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                )}
              </Link>
            )}
            
            {/* Zoom indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-20 overflow-hidden rounded ${
                    selectedImage === idx ? 'ring-2 ring-gray-900 dark:ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Look Info - Centered under image */}
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
            {look.title}
          </h1>

          {blogger && (
            <Link 
              to={createPageUrl('BloggerProfile') + '?id=' + blogger.id}
              className="inline-block mb-4"
            >
              <div className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                {blogger.profile_image && (
                  <img 
                    src={blogger.profile_image} 
                    alt={blogger.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <Badge variant="secondary" className="text-sm cursor-pointer">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Curated by {blogger.name}
                </Badge>
              </div>
            </Link>
          )}

          {look.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 font-light mb-6">
              {look.description}
            </p>
          )}

          {look.tags?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {look.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Shop The Look Button */}
          <Button
            size="lg"
            className="w-full max-w-sm font-light text-lg py-6"
            onClick={() => openLookSidebar(look)}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {t('shopTheLook')}
          </Button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {t('clickToSeeProducts')}
          </p>
        </div>

        {/* Related Looks */}
        {relatedLooks.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-8 text-center">
              {t('youMayAlsoLike')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedLooks.map((relatedLook) => {
                const img = relatedLook.images?.[0] || relatedLook.image;
                return (
                  <Link
                    key={relatedLook.id}
                    to={createPageUrl('LookDetail') + '?id=' + relatedLook.id}
                    className="group"
                  >
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg mb-4">
                      <img
                        src={img}
                        alt={relatedLook.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-lg font-light text-gray-900 dark:text-white text-center">
                      {relatedLook.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            {images[selectedImage] && (
              <img
                src={images[selectedImage]}
                alt={look.title}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}