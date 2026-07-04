import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductCard from '../components/products/ProductCard';

export default function ProductDetail() {
  const { t, getLocalizedField } = useLanguage();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const prod = await base44.entities.Product.filter({ id: productId });
      if (prod.length === 0) throw new Error('Product not found');
      
      // Increment views
      await base44.entities.Product.update(productId, {
        views: (prod[0].views || 0) + 1
      });
      
      return prod[0];
    },
    enabled: !!productId
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.gender, product?.category_id],
    queryFn: async () => {
      if (!product) return [];
      // Filter by same gender for recommendations
      const related = await base44.entities.Product.filter({ 
        gender: product.gender,
        is_active: true
      }, '-created_date', 20);
      // Prioritize same category, exclude current product
      const filtered = related
        .filter(p => p.id !== product.id)
        .sort((a, b) => {
          // Same category first
          if (a.category_id === product.category_id && b.category_id !== product.category_id) return -1;
          if (b.category_id === product.category_id && a.category_id !== product.category_id) return 1;
          return 0;
        })
        .slice(0, 4);
      return filtered;
    },
    enabled: !!product
  });

  const addToBagMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const cart = user.cart || [];
      
      const existingItemIndex = cart.findIndex(
        item => item.product_id === productId && 
                item.size === selectedSize
      );

      let newCart;
      if (existingItemIndex >= 0) {
        newCart = [...cart];
        newCart[existingItemIndex].quantity += 1;
      } else {
        newCart = [...cart, {
          product_id: productId,
          size: selectedSize,
          quantity: 1
        }];
      }

      await base44.auth.updateMe({ cart: newCart });
      return newCart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setAddedToBag(true);
      setTimeout(() => setAddedToBag(false), 2000);
    },
    onError: (error) => {
      alert(error.message || 'Unable to add to bag');
    }
  });

  const handleAddToBag = () => {
    // Only require size if sizes are available
    if (availableSizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    addToBagMutation.mutate();
  };

  const toggleWishlist = async () => {
    try {
      const user = await base44.auth.me();
      
      if (!isWishlisted) {
        await base44.entities.Wishlist.create({
          user_id: user.id,
          product_id: productId
        });
        setIsWishlisted(true);
      } else {
        const wishlists = await base44.entities.Wishlist.filter({
          user_id: user.id,
          product_id: productId
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



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">Product not found</p>
      </div>
    );
  }

  const title = getLocalizedField(product, 'title');
  const description = getLocalizedField(product, 'description');
  const material = getLocalizedField(product, 'material');
  const images = product.images || [];
  
  // Get available sizes from variants
  const availableSizes = [...new Set(product.variants?.map(v => v.size).filter(Boolean))] || [];
  
  const isInStock = true;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-28 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Images */}
          <div>
            {/* Main Image - Swipeable on mobile */}
            <div className="aspect-square sm:aspect-[3/4] bg-gray-100 dark:bg-gray-800 mb-3 lg:mb-4 overflow-hidden rounded-lg relative">
              <img
                src={images[selectedImage] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Mobile Image Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImage === idx ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Grid - Desktop only */}
            {images.length > 1 && (
              <div className="hidden lg:grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-[3/4] overflow-hidden rounded-md ${
                      selectedImage === idx ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Mobile Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-2 lg:hidden overflow-x-auto pb-2 -mx-4 px-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 overflow-hidden rounded-md ${
                      selectedImage === idx ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:pl-8">
            <div className="flex items-start justify-between mb-3 lg:mb-4">
              <div className="flex-1 pr-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-gray-900 dark:text-white mb-1 lg:mb-2 line-clamp-2">
                  {title}
                </h1>
                {product.brand && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.brand}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleWishlist}
                className="h-11 w-11 flex-shrink-0"
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>

            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
              ${product.price.toFixed(2)}
            </p>

            {product.is_new && (
              <Badge className="mb-4">NEW</Badge>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-5 lg:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('selectSize')}
                  </label>
                  <button className="text-sm text-gray-600 dark:text-gray-400 underline">
                    {t('sizeGuide')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      onClick={() => setSelectedSize(size)}
                      className="h-12 min-w-[48px] px-4 text-base font-medium"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}





            {/* Add to Bag Button - Desktop */}
            <div className="hidden lg:block">
              <Button
                size="lg"
                className="w-full h-14 text-base mb-4 font-medium"
                onClick={handleAddToBag}
                disabled={!isInStock || addToBagMutation.isPending || (availableSizes.length > 0 && !selectedSize)}
              >
                {addedToBag ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {t('addToBag')}
                  </>
                )}
              </Button>
            </div>

            {/* Product Details - Accordion on mobile */}
            <div className="border-t dark:border-gray-800 pt-5 lg:pt-6 space-y-4">
              {description && (
                <details className="group" open>
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 dark:text-white py-2">
                    {t('description')}
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light pb-3">
                    {description}
                  </p>
                </details>
              )}

              {material && (
                <details className="group border-t dark:border-gray-800 pt-2">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 dark:text-white py-2">
                    {t('material')}
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light pb-3">
                    {material}
                  </p>
                </details>
              )}

              {product.sku && (
                <div className="border-t dark:border-gray-800 pt-3">
                  <p className="text-xs text-gray-500">
                    SKU: {product.sku}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 lg:mt-20">
            <h2 className="text-xl lg:text-3xl font-medium tracking-tight text-gray-900 dark:text-white mb-4 lg:mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t dark:border-gray-800 p-4 lg:hidden z-40">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
          </div>
          <Button
            size="lg"
            className="flex-1 h-14 text-base font-medium"
            onClick={handleAddToBag}
            disabled={!isInStock || addToBagMutation.isPending || (availableSizes.length > 0 && !selectedSize)}
          >
            {addedToBag ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Added
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-5 w-5" />
                {t('addToBag')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}