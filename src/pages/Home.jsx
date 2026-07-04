import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Clock, Zap } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import HeroCarousel from '../components/home/HeroCarousel';

export default function Home() {
  const { t } = useLanguage();

  const { data: newProducts = [] } = useQuery({
    queryKey: ['new-products'],
    queryFn: () => base44.entities.Product.filter({ is_new: true, is_active: true }, '-created_date', 8)
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['active-campaigns'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const allPromos = await base44.entities.PromoCode.list();
      return allPromos.filter(p => 
        p.is_active && 
        (!p.expiration_date || new Date(p.expiration_date) >= new Date())
      ).slice(0, 3);
    }
  });

  return (
    <div className="min-h-screen">
      {/* Hero Carousel - Old Money Luxury */}
      <HeroCarousel />

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 'var(--spacing-section)', paddingBottom: 'var(--spacing-section)' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-dark)] dark:text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Shop by Category
          </h2>
          <p className="text-[var(--color-secondary)] max-w-md mx-auto">
            Explore our curated collections for every style
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gap: 'var(--spacing-grid)' }}>
          {/* Women */}
          <Link to={createPageUrl('ProductList') + '?gender=women'} className="group relative h-[450px] md:h-[500px] overflow-hidden" style={{ borderRadius: 'var(--border-radius)' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924b069f7ed3363b539284d/258e699f4_image.png"
              alt="Women"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors" />
            <div className="absolute inset-0 flex items-end p-8">
              <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                <span className="inline-block px-3 py-1 bg-[var(--color-primary)] text-white text-xs tracking-wider mb-3" style={{ borderRadius: 'var(--border-radius)' }}>
                  COLLECTION
                </span>
                <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{t('ladies')}</h3>
                <p className="text-white/80 font-light flex items-center group-hover:text-[var(--color-primary)] transition-colors">
                  {t('discoverMore')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </div>
          </Link>

          {/* Men */}
          <Link to={createPageUrl('ProductList') + '?gender=men'} className="group relative h-[450px] md:h-[500px] overflow-hidden" style={{ borderRadius: 'var(--border-radius)' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924b069f7ed3363b539284d/81a263750_image.png"
              alt="Men"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors" />
            <div className="absolute inset-0 flex items-end p-8">
              <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                <span className="inline-block px-3 py-1 bg-[var(--color-primary)] text-white text-xs tracking-wider mb-3" style={{ borderRadius: 'var(--border-radius)' }}>
                  COLLECTION
                </span>
                <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{t('gentlemen')}</h3>
                <p className="text-white/80 font-light flex items-center group-hover:text-[var(--color-primary)] transition-colors">
                  {t('discoverMore')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </div>
          </Link>

          {/* Kids */}
          <Link to={createPageUrl('ProductList') + '?gender=kids'} className="group relative h-[450px] md:h-[500px] overflow-hidden" style={{ borderRadius: 'var(--border-radius)' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924b069f7ed3363b539284d/cdde719c1_image.png"
              alt="Kids"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors" />
            <div className="absolute inset-0 flex items-end p-8">
              <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                <span className="inline-block px-3 py-1 bg-[var(--color-primary)] text-white text-xs tracking-wider mb-3" style={{ borderRadius: 'var(--border-radius)' }}>
                  COLLECTION
                </span>
                <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{t('children')}</h3>
                <p className="text-white/80 font-light flex items-center group-hover:text-[var(--color-primary)] transition-colors">
                  {t('discoverMore')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 'var(--spacing-section)', paddingBottom: 'var(--spacing-section)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-dark)] dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('newArrivals')}
              </h2>
              <p className="text-[var(--color-secondary)] mt-2">Fresh styles just dropped</p>
            </div>
            <Link to={createPageUrl('ProductList') + '?new=true'}>
              <Button 
                variant="outline" 
                className="elysian-btn border-[var(--color-dark)] text-[var(--color-dark)] hover:bg-[var(--color-dark)] hover:text-white dark:border-white dark:text-white"
                style={{ borderRadius: 'var(--border-radius)' }}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" style={{ gap: 'var(--spacing-grid)' }}>
            {newProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Active Promo Codes / Flash Sales */}
      {campaigns.length > 0 && (
        <section className="bg-[var(--color-dark)]" style={{ paddingTop: 'var(--spacing-section)', paddingBottom: 'var(--spacing-section)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="elysian-live-badge inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-error)] text-white text-xs font-bold tracking-wider rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE NOW
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Flash Sales
                </h2>
                <p className="text-white/60 mt-2">Limited time offers - Don't miss out!</p>
              </div>
              <Link to={createPageUrl('ProductList') + '?sale=true'}>
                <Button 
                  className="elysian-btn bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
                  style={{ borderRadius: 'var(--border-radius)' }}
                >
                  View All Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gap: 'var(--spacing-grid)' }}>
              {campaigns.map((promo) => (
                <div 
                  key={promo.id}
                  className="group relative h-[320px] overflow-hidden elysian-glass"
                  style={{ borderRadius: 'var(--border-radius)', background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(139,115,85,0.2))' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-secondary)]/30" />
                  <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                    {/* Discount Badge */}
                    <div className="elysian-badge-pulse absolute top-4 right-4 bg-[var(--color-primary)] text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                      {promo.discount_type === 'percentage' 
                        ? `-${promo.discount_value}%` 
                        : `-€${promo.discount_value}`}
                    </div>
                    
                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{promo.name}</h3>
                    
                    {/* Promo Code */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 mb-4" style={{ borderRadius: 'var(--border-radius)' }}>
                      <span className="text-white/60 text-xs block mb-1">Use code</span>
                      <span className="text-xl font-bold font-mono text-[var(--color-primary)] tracking-wider">{promo.code}</span>
                    </div>
                    
                    {/* Timer */}
                    {promo.expiration_date && (
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Ends {new Date(promo.expiration_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="relative overflow-hidden" style={{ paddingTop: 'var(--spacing-section)', paddingBottom: 'var(--spacing-section)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-4 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium tracking-wider mb-4" style={{ borderRadius: 'var(--border-radius)' }}>
              NEWSLETTER
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-dark)] dark:text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Stay Updated
            </h2>
            <p className="text-lg text-[var(--color-secondary)] mb-8">
              Subscribe to our newsletter for exclusive offers and early access to new collections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[var(--color-dark)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                style={{ borderRadius: 'var(--border-radius)' }}
              />
              <Button 
                className="elysian-btn bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white px-8 py-3.5 font-medium"
                style={{ borderRadius: 'var(--border-radius)' }}
              >
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-[var(--color-secondary)]/60 mt-4">
              By subscribing, you agree to our Privacy Policy
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}