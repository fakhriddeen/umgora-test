import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Search, Plus, MoreHorizontal, Package, Edit, Trash2, Upload, X, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SellerProducts() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(urlParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['seller-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: seller } = useQuery({
    queryKey: ['seller-profile', user?.email?.toLowerCase()],
    queryFn: async () => {
      if (!user?.email) return null;
      const allSellers = await base44.entities.Seller.list();
      return allSellers.find(s => s.email?.toLowerCase() === user.email.toLowerCase()) || null;
    },
    enabled: !!user?.email,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['seller-products', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return base44.entities.Product.filter({ seller_id: seller.id });
    },
    enabled: !!seller?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const allCategories = await base44.entities.Category.list('name_en', 100);
      return allCategories.filter(cat => cat.is_active !== false);
    },
  });

  const [formData, setFormData] = useState({
    title_en: '',
    title_de: '',
    title_ru: '',
    description_en: '',
    description_de: '',
    description_ru: '',
    price: 0,
    images: [],
    category_id: '',
    gender: 'unisex',
    brand: '',
    size_type: 'clothing',
    total_stock: 0,
    is_active: true,
    is_new: false,
    variants: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Available sizes for shoes
  const availableSizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  // Generate next SKU for seller
  const generateNextSku = async () => {
    if (!seller) return '';
    const prefix = seller.sku_prefix || 'XX';
    const nextNum = (seller.sku_counter || 0) + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Generate SKU automatically
      const sku = await generateNextSku();
      
      // Create product with seller's ID and auto-generated SKU
      const product = await base44.entities.Product.create({ 
        ...data, 
        seller_id: seller?.id,
        sku: sku,
      });
      
      // Update seller's SKU counter and product count
      await base44.entities.Seller.update(seller.id, {
        sku_counter: (seller.sku_counter || 0) + 1,
        total_products: (seller.total_products || 0) + 1,
      });
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Security: verify ownership before update
      const product = products.find(p => p.id === id);
      if (!product || product.seller_id !== seller?.id) {
        throw new Error('You can only edit your own products');
      }
      return base44.entities.Product.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setIsFormOpen(false);
      setEditingProduct(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Security: verify ownership before delete
      const product = products.find(p => p.id === id);
      if (!product || product.seller_id !== seller?.id) {
        throw new Error('You can only delete your own products');
      }
      return base44.entities.Product.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_de: '',
      title_ru: '',
      description_en: '',
      description_de: '',
      description_ru: '',
      price: 0,
      images: [],
      category_id: '',
      gender: 'unisex',
      brand: seller?.brand_name || '',
      size_type: 'clothing',
      total_stock: 0,
      is_active: true,
      is_new: false,
      variants: [],
    });
  };
  
  // Toggle size selection
  const toggleSize = (size) => {
    const variants = formData.variants || [];
    const existingIndex = variants.findIndex(v => v.size === size);
    
    if (existingIndex >= 0) {
      // Remove size
      setFormData({
        ...formData,
        variants: variants.filter((_, i) => i !== existingIndex)
      });
    } else {
      // Add size with default stock
      setFormData({
        ...formData,
        variants: [...variants, { size, stock: 0 }]
      });
    }
  };
  
  // Update size stock
  const updateSizeStock = (size, stock) => {
    const variants = formData.variants || [];
    setFormData({
      ...formData,
      variants: variants.map(v => v.size === size ? { ...v, stock: Number(stock) } : v)
    });
  };

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

  const exportToCSV = () => {
    const headers = ['Title', 'SKU', 'Price', 'Stock', 'Status', 'Brand'];
    const rows = filteredProducts.map(p => [
      p.title_en || '',
      p.sku || '',
      p.price?.toFixed(2) || '0',
      p.total_stock || 0,
      p.is_active ? 'Active' : 'Inactive',
      p.brand || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-products.csv';
    a.click();
  };

  const handleEdit = (product) => {
    // Security check: only allow editing own products
    if (product.seller_id !== seller?.id) {
      alert('You can only edit your own products.');
      return;
    }
    setEditingProduct(product);
    setFormData({
      title_en: product.title_en || '',
      title_de: product.title_de || '',
      title_ru: product.title_ru || '',
      description_en: product.description_en || '',
      description_de: product.description_de || '',
      description_ru: product.description_ru || '',
      price: product.price || 0,
      images: product.images || [],
      category_id: product.category_id || '',
      gender: product.gender || 'unisex',
      brand: product.brand || '',
      size_type: product.size_type || 'clothing',
      total_stock: product.total_stock || 0,
      is_active: product.is_active ?? true,
      is_new: product.is_new ?? false,
      variants: product.variants || [],
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    // Calculate total stock from variants
    const totalStock = formData.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || formData.total_stock || 0;
    const dataToSave = { ...formData, total_stock: totalStock };
    
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const filteredProducts = products.filter(product =>
    !searchQuery || 
    product.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout requireAdmin={false} requireSeller={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Products</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your product listings</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { resetForm(); setEditingProduct(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
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
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        {searchQuery ? 'No products match your search' : 'No products yet'}
                      </p>
                      {!searchQuery && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                          Start by adding your first product to the store
                        </p>
                      )}
                      {!searchQuery && (
                        <Button onClick={() => { resetForm(); setEditingProduct(null); setIsFormOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Product
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt="" 
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.title_en}
                            </p>
                            {product.is_new && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{product.sku || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          €{product.price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${product.total_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.total_stock || 0}
                        </span>
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
                              onClick={() => setDeleteConfirm(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Titles */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="title_en">Title (EN)*</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title_de">Title (DE)</Label>
                  <Input
                    id="title_de"
                    value={formData.title_de || ''}
                    onChange={(e) => setFormData({ ...formData, title_de: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="title_ru">Title (RU)</Label>
                  <Input
                    id="title_ru"
                    value={formData.title_ru || ''}
                    onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description_en">Description (EN)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en || ''}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Price and SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (€)*</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              {/* Category, Gender, Brand */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || 'unisex'}
                    onValueChange={(value) => setFormData({ ...formData, gender: value, category_id: '' })}
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
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
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
                      <div key={size} className="flex items-center gap-2">
                        <button
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
                        {isSelected && (
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock || 0}
                            onChange={(e) => updateSizeStock(size, e.target.value)}
                            className="w-20"
                            placeholder="Stock"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Total stock: {formData.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0}
                </p>
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

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_new"
                    checked={formData.is_new}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                  />
                  <Label htmlFor="is_new" className="cursor-pointer">New Arrival</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title_en || formData.price <= 0 || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm?.title_en}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}