import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../LanguageContext';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product, index = 0 }) {
  const { getLocalizedField } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const title = getLocalizedField(product, 'title');
  const images = product.images || [];
  const mainImage = images[currentImageIndex] || images[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400';
  
  const productUrl = createPageUrl('ProductDetail') + '?id=' + product.id;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = await base44.auth.me();
      
      if (!isWishlisted) {
        await base44.entities.Wishlist.create({
          user_id: user.id,
          product_id: product.id
        });
        setIsWishlisted(true);
      } else {
        const wishlists = await base44.entities.Wishlist.filter({
          user_id: user.id,
          product_id: product.id
        });
        if (wishlists.length > 0) {
          await base44.entities.Wishlist.delete(wishlists[0].id);
        }
        setIsWishlisted(false);
      }
    } catch (err) {
      base44.auth.redirectToLogin();
    }
  };

  return (
    <Link to={productUrl}>
      <div 
        className="elysian-card group relative"
        style={{ 
          animationDelay: `${index * 0.1}s`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="aspect-square sm:aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden mb-2 sm:mb-4 relative rounded-lg">
          <img
            src={mainImage}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
              isHovered ? 'scale-[1.06]' : 'scale-100'
            }`}
            onMouseEnter={() => {
              if (images.length > 1) setCurrentImageIndex(1);
            }}
            onMouseLeave={() => setCurrentImageIndex(0)}
          />
          
          {/* Hover Overlay - Desktop only */}
          <div className={`hidden sm:block absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
          
          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2">
            {product.is_new && (
              <Badge className="elysian-badge-new bg-[var(--color-dark)] text-white text-[9px] sm:text-[10px] tracking-wider font-medium px-2 sm:px-3 py-0.5 sm:py-1">
                NEW
              </Badge>
            )}
          </div>

          {/* Wishlist Button - Always visible on mobile */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 sm:h-9 sm:w-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg transition-all ${
                isHovered ? 'opacity-100' : 'sm:opacity-0'
              }`}
              onClick={toggleWishlist}
            >
              <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-[var(--color-error)] text-[var(--color-error)]' : 'text-gray-700'}`} />
            </Button>
          </div>

          {/* Quick Add Button - Desktop hover only */}
          <div className={`hidden sm:block absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <Button 
              className="w-full h-10 bg-white/95 text-[var(--color-dark)] hover:bg-white font-medium text-sm tracking-wide shadow-lg rounded-lg"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </div>


        </div>

        {/* Product Info */}
        <div className="space-y-1 sm:space-y-2">
          {/* Brand */}
          {product.brand && (
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[1px] sm:tracking-[1.5px] text-[var(--color-secondary)] font-medium">
              {product.brand}
            </p>
          )}
          
          {/* Title */}
          <h3 className="text-sm font-medium text-[var(--color-dark)] dark:text-white line-clamp-2 leading-tight">
            {title}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--color-primary)]">
              €{product.price?.toFixed(2)}
            </span>
          </div>


        </div>
      </div>
    </Link>
  );
}