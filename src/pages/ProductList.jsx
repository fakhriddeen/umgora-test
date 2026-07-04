import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import ProductCard from '../components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Section definitions for each gender (removed home, furniture, household categories)
// Map category slugs to their section keys
const CATEGORY_TO_SECTION = {
  'women-clothing': 'clothing',
  'women-shoes': 'shoes',
  'women-accessories': 'accessories',
  'men-clothing': 'clothing',
  'men-shoes': 'shoes',
  'men-accessories': 'accessories',
  'kids-clothing': 'clothing',
  'kids-shoes': 'shoes',
  'kids-accessories': 'accessories',
};

const SECTIONS = {
  women: [
    { key: 'clothing' },
    { key: 'shoes' },
    { key: 'accessories' },
  ],
  men: [
    { key: 'clothing' },
    { key: 'shoes' },
    { key: 'accessories' },
  ],
  kids: [
    { key: 'clothing' },
    { key: 'shoes' },
    { key: 'accessories' },
  ],
};

export default function ProductList() {
  const { t } = useLanguage();
  const location = useLocation();
  
  // Parse URL params on every render to catch changes
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const gender = urlParams.get('gender');
  const isNew = urlParams.get('new') === 'true';
  const isSale = urlParams.get('sale') === 'true';
  
  // State
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('-created_date');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Reset filters when gender/category changes
  useEffect(() => {
    setSelectedSections([]);
    setSelectedSizes([]);
    setPriceRange([0, 1000]);
    setInStockOnly(false);
  }, [gender, isSale, isNew]);

  // Close mobile filters on route change
  useEffect(() => {
    setShowMobileFilters(false);
  }, [location.pathname, location.search]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Get sections for current gender
  const currentSections = gender ? (SECTIONS[gender] || []) : [];

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-list', gender, isNew, isSale, sortBy],
    queryFn: async () => {
      let allProducts = await base44.entities.Product.list(sortBy, 200);
      allProducts = allProducts.filter(p => p.is_active);
      
      if (gender) {
        allProducts = allProducts.filter(p => p.gender === gender);
      }
      if (isNew) {
        allProducts = allProducts.filter(p => p.is_new);
      }
      
      return allProducts;
    },
    staleTime: 30000,
  });

  // Fetch categories for filtering
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const cats = await base44.entities.Category.list();
      return cats.filter(c => c.is_active !== false);
    }
  });

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Section filter
    if (selectedSections.length > 0) {
      result = result.filter(p => {
        if (!p.category_id) return false;
        
        // Find the product's category
        const productCategory = allCategories.find(c => c.id === p.category_id);
        if (!productCategory) return false;
        
        // Map category to section
        const categorySection = CATEGORY_TO_SECTION[productCategory.slug];
        return selectedSections.includes(categorySection);
      });
    }
    
    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter(p => 
        p.variants?.some(v => selectedSizes.includes(v.size))
      );
    }
    
    // Price filter
    result = result.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    
    // Stock filter
    if (inStockOnly) {
      result = result.filter(p => p.total_stock > 0);
    }
    
    return result;
  }, [products, selectedSections, selectedSizes, priceRange, inStockOnly, currentSections, allCategories]);

  const toggleSection = (sectionKey) => {
    setSelectedSections(prev => 
      prev.includes(sectionKey) 
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setSelectedSections([]);
    setSelectedSizes([]);
    setPriceRange([0, 1000]);
    setInStockOnly(false);
  };

  const hasActiveFilters = selectedSections.length > 0 || selectedSizes.length > 0 || 
    priceRange[0] > 0 || priceRange[1] < 1000 || inStockOnly;

  const getPageTitle = () => {
    if (isSale) return t('allCampaigns');
    if (isNew) return t('newArrivals');
    if (gender === 'women') return t('ladies');
    if (gender === 'men') return t('gentlemen');
    if (gender === 'kids') return t('children');
    return t('products');
  };

  // Filter sidebar content
  const FilterContent = ({ isMobile = false }) => (
    <div className={`space-y-6 ${isMobile ? 'p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('filterBy')}
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              {t('clearAll')}
            </Button>
          )}
          {isMobile && (
            <button onClick={() => setShowMobileFilters(false)} className="p-1">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Section Filters (only for gender pages) */}
      {currentSections.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('category')}</Label>
          <div className="space-y-2">
            {currentSections.map((section) => (
              <button
                key={section.key}
                onClick={() => toggleSection(section.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                  selectedSections.includes(section.key)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <span className="text-sm font-medium">{t(section.key)}</span>
                {selectedSections.includes(section.key) && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t('priceRange')}</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={1000}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>€{priceRange[0]}</span>
          <span>€{priceRange[1]}</span>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t('size')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={selectedSizes.includes(size) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSize(size)}
              className="text-xs"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="in-stock"
          checked={inStockOnly}
          onCheckedChange={setInStockOnly}
        />
        <label htmlFor="in-stock" className="text-sm cursor-pointer">
          {t('inStock')}
        </label>
      </div>

      {/* Apply button for mobile */}
      {isMobile && (
        <Button 
          className="w-full mt-4" 
          onClick={() => setShowMobileFilters(false)}
        >
          Show {filteredProducts.length} Products
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 sm:w-48">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">{t('newestFirst')}</SelectItem>
                <SelectItem value="created_date">{t('oldestFirst')}</SelectItem>
                <SelectItem value="price">{t('priceLowHigh')}</SelectItem>
                <SelectItem value="-price">{t('priceHighLow')}</SelectItem>
                <SelectItem value="-sales_count">{t('mostPopular')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t('filterBy')}
              {hasActiveFilters && (
                <span className="ml-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedSections.length + selectedSizes.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <FilterContent />
            </div>
          </aside>

          {/* Mobile Filters Modal */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => setShowMobileFilters(false)} 
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white dark:bg-gray-900 overflow-y-auto">
                <FilterContent isMobile />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-gray-500 mb-4">{t('noProductsFound')}</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    {t('clearFilters')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}