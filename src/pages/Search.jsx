import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { Badge } from '@/components/ui/badge';

export default function Search() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      
      const allProducts = await base44.entities.Product.list();
      const query = debouncedQuery.toLowerCase();
      
      return allProducts.filter(p => {
        if (!p.is_active) return false;
        
        // SKU exact or partial match (prioritized)
        if (p.sku && p.sku.toLowerCase().includes(query)) return true;
        
        // Variant SKU match
        if (p.variants?.some(v => v.sku?.toLowerCase().includes(query))) return true;
        
        // Title match (all languages)
        if (p.title_en?.toLowerCase().includes(query)) return true;
        if (p.title_de?.toLowerCase().includes(query)) return true;
        if (p.title_ru?.toLowerCase().includes(query)) return true;
        
        // Description match (all languages)
        if (p.description_en?.toLowerCase().includes(query)) return true;
        if (p.description_de?.toLowerCase().includes(query)) return true;
        if (p.description_ru?.toLowerCase().includes(query)) return true;
        
        // Material match
        if (p.material_en?.toLowerCase().includes(query)) return true;
        if (p.material_de?.toLowerCase().includes(query)) return true;
        if (p.material_ru?.toLowerCase().includes(query)) return true;
        
        // Brand match
        if (p.brand?.toLowerCase().includes(query)) return true;
        
        // Tags/Keywords match
        if (p.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
        
        // Gender match
        if (p.gender?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    },
    enabled: debouncedQuery.length > 0
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-8 text-center">
            {t('search')}
          </h1>
          
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, description, SKU, brand, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Search by title, description, SKU, brand, material, or keywords - Results appear as you type
          </p>
        </div>

        {!debouncedQuery ? (
          <div className="text-center py-20">
            <SearchIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start typing to search for products
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No products found for "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {products.length} {products.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  {product.sku && product.sku.toLowerCase().includes(debouncedQuery.toLowerCase()) && (
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                      SKU: {product.sku}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}