import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '../LanguageContext';
import { X } from 'lucide-react';

export default function ProductFilters({ 
  filters, 
  onFilterChange, 
  categories = [],
  onClose 
}) {
  const { t, getLocalizedField } = useLanguage();
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 1000]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' }
  ];

  const handleSizeToggle = (size) => {
    const currentSizes = filters.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const handleColorToggle = (color) => {
    const currentColors = filters.colors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    onFilterChange({ ...filters, colors: newColors });
  };

  const handleCategoryToggle = (categoryId) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    onFilterChange({ ...filters, priceRange: value });
  };

  const clearAllFilters = () => {
    setPriceRange([0, 1000]);
    onFilterChange({});
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('filterBy')}
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-sm"
          >
            {t('clearAll')}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-900 dark:text-white">
          {t('priceRange')}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          max={1000}
          step={10}
          className="w-full"
        />
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-900 dark:text-white">
            {t('category')}
          </Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={(filters.categories || []).includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {getLocalizedField(category, 'name')}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900 dark:text-white">
          {t('size')}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={(filters.sizes || []).includes(size) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSizeToggle(size)}
              className="text-xs"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900 dark:text-white">
          {t('color')}
        </Label>
        <div className="grid grid-cols-5 gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorToggle(color.name)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                (filters.colors || []).includes(color.name)
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Stock Filter */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock || false}
            onCheckedChange={(checked) => onFilterChange({ ...filters, inStock: checked })}
          />
          <label
            htmlFor="in-stock"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {t('inStock')}
          </label>
        </div>
      </div>

      {/* New Arrivals */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="new-arrivals"
            checked={filters.isNew || false}
            onCheckedChange={(checked) => onFilterChange({ ...filters, isNew: checked })}
          />
          <label
            htmlFor="new-arrivals"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            New Arrivals
          </label>
        </div>
      </div>
    </div>
  );
}