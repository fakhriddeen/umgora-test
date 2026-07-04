import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Search, Plus, MoreHorizontal, ImageIcon, Edit, Trash2, Upload, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function SellerLooks() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLook, setEditingLook] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Fetch seller's products for look creation
  const { data: myProducts = [] } = useQuery({
    queryKey: ['seller-products', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return base44.entities.Product.filter({ seller_id: seller.id });
    },
    enabled: !!seller?.id,
  });

  // Fetch looks that contain seller's products
  const { data: looks = [], isLoading } = useQuery({
    queryKey: ['seller-looks', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      const allLooks = await base44.entities.Look.list('-created_date');
      // Filter looks that contain at least one of seller's products
      const myProductIds = myProducts.map(p => p.id);
      return allLooks.filter(look => 
        look.product_ids?.some(pid => myProductIds.includes(pid))
      );
    },
    enabled: !!seller?.id && myProducts.length > 0,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [],
    tags: [],
    product_ids: [],
    is_active: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Look.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-looks'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Look.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-looks'] });
      setIsFormOpen(false);
      setEditingLook(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Look.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-looks'] });
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      images: [],
      tags: [],
      product_ids: [],
      is_active: true,
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

  const handleEdit = (look) => {
    setEditingLook(look);
    setFormData({
      title: look.title || '',
      description: look.description || '',
      images: look.images || [],
      tags: look.tags || [],
      product_ids: look.product_ids || [],
      is_active: look.is_active ?? true,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (editingLook) {
      updateMutation.mutate({ id: editingLook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleProductSelection = (productId) => {
    const current = formData.product_ids || [];
    if (current.includes(productId)) {
      setFormData({ ...formData, product_ids: current.filter(id => id !== productId) });
    } else {
      setFormData({ ...formData, product_ids: [...current, productId] });
    }
  };

  const filteredLooks = looks.filter(look =>
    !searchQuery || look.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout requireAdmin={false} requireSeller={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Looks</h1>
            <p className="text-gray-500 dark:text-gray-400">Create and manage outfit looks with your products</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingLook(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Look
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search looks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Looks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : filteredLooks.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No looks found. Create your first look!
            </div>
          ) : (
            filteredLooks.map((look) => (
              <div key={look.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="aspect-[4/5] relative">
                  {look.images?.[0] ? (
                    <img src={look.images[0]} alt={look.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${look.is_active ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {look.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{look.title}</h3>
                      <p className="text-sm text-gray-500">{look.product_ids?.length || 0} products</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(look)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteConfirm(look)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLook ? 'Edit Look' : 'Create New Look'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Casual Look"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this look..."
                  rows={3}
                />
              </div>

              {/* Images */}
              <div>
                <Label>Look Images</Label>
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

              {/* Product Selection */}
              <div>
                <Label>Select Products for this Look</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {myProducts.length === 0 ? (
                    <p className="col-span-full text-sm text-gray-500">No products available. Add products first.</p>
                  ) : (
                    myProducts.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`cursor-pointer border rounded-lg p-2 transition-colors ${
                          formData.product_ids?.includes(product.id) 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full aspect-square object-cover rounded mb-2" />
                        ) : (
                          <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        )}
                        <p className="text-xs font-medium truncate">{product.title_en}</p>
                        <p className="text-xs text-gray-500">€{product.price?.toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">{formData.product_ids?.length || 0} products selected</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">Active (visible on store)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || formData.product_ids?.length === 0 || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingLook ? 'Update Look' : 'Create Look')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Look</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
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