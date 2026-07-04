import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

const defaultSlides = [
  {
    id: 1,
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924b069f7ed3363b539284d/ab08ff27f_image.png',
    status: 'Live Now',
    brand: 'HERITAGE COLLECTION',
    title: 'Old Money Style',
    subtitle: 'Timeless Elegance Redefined',
    buttonText: 'Discover Collection',
    link: '/ProductList?sale=true'
  },
  {
    id: 2,
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924b069f7ed3363b539284d/69dd7a832_image.png',
    status: 'Live Now',
    brand: 'THE CURATED ESSENTIALS',
    title: 'Where Quality Speaks for Itself',
    subtitle: 'Understated Luxury for Every Day',
    buttonText: 'Shop Now',
    link: '/ProductList?new=true'
  }
];

export default function HeroCarousel({ slides = defaultSlides }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [textVisible, setTextVisible] = useState(true);

  const goToSlide = useCallback((index) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setTextVisible(false);
    
    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => {
        setTextVisible(true);
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000);
      }, 400);
    }, 800);
  }, [currentSlide, isAnimating]);

  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative h-[60vh] md:h-[75vh] overflow-hidden bg-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500&display=swap');
        
        .hero-carousel-slide-zoom-in {
          animation: kenBurnsIn 6s ease-out forwards;
        }
        
        .hero-carousel-slide-zoom-out {
          animation: kenBurnsOut 6s ease-out forwards;
        }
        
        @keyframes kenBurnsIn {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
        
        @keyframes kenBurnsOut {
          from { transform: scale(1.08); }
          to { transform: scale(1); }
        }
        
        .hero-text-fade {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .hero-text-visible .hero-text-fade {
          opacity: 1;
          transform: translateY(0);
        }
        
        .hero-text-visible .hero-delay-1 { transition-delay: 0.3s; }
        .hero-text-visible .hero-delay-2 { transition-delay: 0.4s; }
        .hero-text-visible .hero-delay-3 { transition-delay: 0.5s; }
        .hero-text-visible .hero-delay-4 { transition-delay: 0.6s; }
        .hero-text-visible .hero-delay-5 { transition-delay: 0.7s; }
        
        .old-money-filter {
          filter: sepia(8%) saturate(85%) brightness(95%);
        }
        
        .hero-vignette::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%);
          pointer-events: none;
        }
        
        .hero-btn {
          transition: all 0.4s ease-in-out;
        }
        
        .hero-btn:hover {
          background: white;
          color: black;
        }
        
        .hero-dot {
          transition: all 0.4s ease;
        }
        
        .hero-dot:hover {
          transform: scaleY(1.1);
        }
      `}</style>

      {/* Background Image with Ken Burns - Ultra Smooth Transitions */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transition: 'opacity 1.8s ease-in-out'
          }}
        >
          <div className="absolute inset-0 hero-vignette">
            <img
              src={s.image}
              alt={s.title}
              className={`w-full h-full object-cover old-money-filter ${
                index === currentSlide 
                  ? index === 0 
                    ? 'hero-carousel-slide-zoom-in' 
                    : 'hero-carousel-slide-zoom-out'
                  : ''
              }`}
              style={{ objectPosition: 'center' }}
            />
          </div>
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div 
          className={`px-10 md:px-20 pb-16 md:pb-24 max-w-4xl ${textVisible ? 'hero-text-visible' : ''}`}
        >
          {/* Status Badge */}
          <div className="hero-text-fade hero-delay-1 mb-4">
            <span 
              className="inline-block px-5 py-1.5 text-[13px] text-white/90 font-light tracking-wide"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '20px'
              }}
            >
              {slide.status}
            </span>
          </div>

          {/* Brand Name */}
          <p 
            className="hero-text-fade hero-delay-2 text-[13px] text-white/80 font-normal mb-3"
            style={{ letterSpacing: '4px' }}
          >
            {slide.brand}
          </p>

          {/* Campaign Title */}
          <h1 
            className="hero-text-fade hero-delay-3 text-4xl md:text-6xl lg:text-[68px] text-white font-light mb-3 leading-[1.1]"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              maxWidth: '750px'
            }}
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          {slide.subtitle && (
            <p 
              className="hero-text-fade hero-delay-4 text-lg md:text-xl lg:text-2xl text-white/80 font-light mb-8 max-w-lg"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}
            >
              {slide.subtitle}
            </p>
          )}

          {/* CTA Button */}
          <div className="hero-text-fade hero-delay-5">
            <Link to={createPageUrl(slide.link.replace('/', ''))}>
              <button 
                className="hero-btn px-9 py-3.5 text-[15px] text-white font-light tracking-wide flex items-center gap-2"
                style={{
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderRadius: '0',
                  letterSpacing: '1px'
                }}
              >
                {slide.buttonText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Dots - Minimal Lines */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="hero-dot w-10 flex items-center justify-center py-2"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div 
              className="w-full transition-all duration-400"
              style={{
                height: index === currentSlide ? '2px' : '1px',
                background: index === currentSlide ? 'white' : 'rgba(255,255,255,0.4)'
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}