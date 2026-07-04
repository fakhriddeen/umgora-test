import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload, X, Search, Download, MoreHorizontal, Package, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminProducts() {
  const { t, getLocalizedField } = useLanguage();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [isDialogOpen, setIsDialogOpen] = useState(urlParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date')
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const allCategories = await base44.entities.Category.list();
      return allCategories.filter(cat => cat.is_active !== false);
    }
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active);
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Title', 'SKU', 'Price', 'Status', 'Brand'];
    const rows = filteredProducts.map(p => [
      p.title_en || '',
      p.sku || '',
      p.price?.toFixed(2) || '0',
      p.is_active ? 'Active' : 'Inactive',
      p.brand || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });

  const handleDelete = (product) => {
    if (confirm(`Delete "${product.title_en}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="text-gray-500 dark:text-gray-400">{filteredProducts.length} products</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.category_id);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title_en}
                                className="w-12 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.title_en}
                              </p>
                              <p className="text-xs text-gray-500">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.sku || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {category?.name_en || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          €{product.price?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(product)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              categories={categories}
              onClose={() => setIsDialogOpen(false)}
              queryClient={queryClient}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function ProductForm({ product, categories, onClose, queryClient }) {
  const [formData, setFormData] = useState(product || {
    title_en: '',
    title_de: '',
    title_ru: '',
    description_en: '',
    description_de: '',
    description_ru: '',
    price: 0,
    images: [],
    category_id: '',
    brand: '',
    gender: 'unisex',
    size_type: 'clothing',
    sku: '',
    variants: [],
    is_new: false,
    is_active: true,
    total_stock: 0
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  // Toggle size selection
  const toggleSize = (size) => {
    const variants = formData.variants || [];
    const existingIndex = variants.findIndex(v => v.size === size);
    
    if (existingIndex >= 0) {
      setFormData({
        ...formData,
        variants: variants.filter((_, i) => i !== existingIndex)
      });
    } else {
      setFormData({
        ...formData,
        variants: [...variants, { size, color: null, color_hex: null }]
      });
    }
  };

  const saveProductMutation = useMutation({
    mutationFn: async (data) => {
      if (product) {
        return base44.entities.Product.update(product.id, data);
      } else {
        return base44.entities.Product.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      onClose();
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        images: [...(formData.images || []), result.file_url]
      });
    } catch (err) {
      alert('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProductMutation.mutate(formData);
  };

  const generateDescription = async () => {
    if (!formData.title_en) {
      alert('Please enter a product title first');
      return;
    }

    setGeneratingDesc(true);
    try {
      const category = categories.find(c => c.id === formData.category_id);
      const categoryName = category?.name_en || 'product';
      
      const prompt = `Write a compelling product description for an e-commerce platform.

Product Title: ${formData.title_en}
Category: ${categoryName}
Gender: ${formData.gender}
Brand: ${formData.brand || 'N/A'}
Price: €${formData.price || 'TBD'}
${formData.size_type ? `Size Type: ${formData.size_type}` : ''}

Create a professional, engaging description (2-3 sentences) that highlights the product's key features, benefits, and appeal. Be concise and persuasive.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setFormData({ ...formData, description_en: response.trim() });
    } catch (error) {
      alert('Failed to generate description. Please try again.');
    }
    setGeneratingDesc(false);
  };

  const translateTitles = async () => {
    const filledFields = [
      { key: 'title_en', lang: 'English' },
      { key: 'title_de', lang: 'German' },
      { key: 'title_ru', lang: 'Russian' }
    ].filter(f => formData[f.key]);

    if (filledFields.length === 0) {
      alert('Please enter at least one product title first');
      return;
    }

    setTranslating(true);
    try {
      const source = filledFields[0];
      const targetLangs = [
        { key: 'title_en', lang: 'English' },
        { key: 'title_de', lang: 'German' },
        { key: 'title_ru', lang: 'Russian' }
      ].filter(t => t.key !== source.key);

      const prompt = `Translate the following product title to ${targetLangs.map(t => t.lang).join(' and ')}.

Original (${source.lang}): ${formData[source.key]}

Provide translations in this exact JSON format:
{
  "${targetLangs[0].key}": "translation here",
  "${targetLangs[1].key}": "translation here"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: targetLangs.reduce((acc, t) => ({ ...acc, [t.key]: { type: 'string' } }), {})
        }
      });

      setFormData({ ...formData, ...response });
    } catch (error) {
      alert('Failed to translate. Please try again.');
    }
    setTranslating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Product Titles</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={translateTitles}
            disabled={translating}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {translating ? 'Translating...' : 'Auto-Translate'}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title_en">Title (EN)*</Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({...formData, title_en: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="title_de">Title (DE)</Label>
            <Input
              id="title_de"
              value={formData.title_de || ''}
              onChange={(e) => setFormData({...formData, title_de: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="title_ru">Title (RU)</Label>
            <Input
              id="title_ru"
              value={formData.title_ru || ''}
              onChange={(e) => setFormData({...formData, title_ru: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="description_en">Description (EN)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateDescription}
            disabled={generatingDesc || !formData.title_en}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generatingDesc ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>
        <Textarea
          id="description_en"
          value={formData.description_en || ''}
          onChange={(e) => setFormData({...formData, description_en: e.target.value})}
          rows={4}
          placeholder="AI-generated description will appear here, or write your own..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price*</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku || ''}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender || 'unisex'}
            onValueChange={(value) => setFormData({...formData, gender: value, category_id: ''})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="kids">Kids</SelectItem>
              <SelectItem value="unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id || ''}
            onValueChange={(value) => setFormData({...formData, category_id: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((cat) => {
                  if (!formData.gender) return false;
                  if (formData.gender === 'unisex') {
                    return cat.gender === 'men' || cat.gender === 'women';
                  }
                  return cat.gender === formData.gender;
                })
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_en}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand || ''}
            onChange={(e) => setFormData({...formData, brand: e.target.value})}
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <Label>Product Images</Label>
        <div className="mt-2 flex flex-wrap gap-4">
          {formData.images?.map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img} alt="" className="w-24 h-32 object-cover rounded" />
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  images: formData.images.filter((_, i) => i !== idx)
                })}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-24 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-400">
            {uploadingImage ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </>
            )}
          </label>
        </div>
      </div>

      {/* Size Type */}
      <div>
        <Label>Size Type</Label>
        <Select
          value={formData.size_type || 'clothing'}
          onValueChange={(value) => setFormData({ ...formData, size_type: value, variants: [] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clothing">Clothing Sizes (XS-XXL)</SelectItem>
            <SelectItem value="shoes">Shoe Sizes (36-45)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sizes */}
      <div>
        <Label>Available Sizes</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(formData.size_type === 'shoes' 
            ? ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
            : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
          ).map((size) => {
            const variant = formData.variants?.find(v => v.size === size);
            const isSelected = !!variant;
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isSelected 
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_new"
            checked={formData.is_new}
            onCheckedChange={(checked) => setFormData({...formData, is_new: checked})}
          />
          <Label htmlFor="is_new" className="cursor-pointer">New Arrival</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
          />
          <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveProductMutation.isPending}>
          {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}