import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import AdminLayout from '../components/admin/AdminLayout';
import MetricCard from '../components/admin/MetricCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus, Edit, Trash2, Copy, Check, Tag, DollarSign, ShoppingCart, TrendingUp
} from 'lucide-react';

export default function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [isDialogOpen, setIsDialogOpen] = useState(urlParams.get('action') === 'new');
  const [editingPromo, setEditingPromo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => base44.entities.PromoCode.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] })
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate totals
  const totalRevenue = promoCodes.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  const totalEarned = promoCodes.reduce((sum, p) => sum + (p.earned_revenue || 0), 0);
  const totalUses = promoCodes.reduce((sum, p) => sum + (p.total_uses || 0), 0);
  const activeCodes = promoCodes.filter(p => p.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Codes</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage discount codes and track usage</p>
          </div>
          <Button onClick={() => { setEditingPromo(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Promo Code
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Promo Codes"
            value={promoCodes.length}
            icon={Tag}
            color="blue"
          />
          <MetricCard
            title="Active Codes"
            value={activeCodes}
            icon={Check}
            color="green"
          />
          <MetricCard
            title="Total Uses"
            value={totalUses}
            icon={ShoppingCart}
            color="purple"
          />
          <MetricCard
            title="Revenue Generated"
            value={totalRevenue.toFixed(2)}
            icon={DollarSign}
            color="green"
            prefix="€"
          />
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No promo codes yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {promo.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(promo.code)}
                          >
                            {copiedCode === promo.code ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promo.discount_type === 'percentage' 
                            ? `${promo.discount_value}%` 
                            : `$${promo.discount_value}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promo.applies_to_all ? (
                          <Badge className="bg-blue-100 text-blue-800">All Products</Badge>
                        ) : (
                          <Badge variant="outline">{promo.product_ids?.length || 0} products</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.expiration_date 
                          ? new Date(promo.expiration_date).toLocaleDateString()
                          : <span className="text-gray-400">Never</span>
                        }
                      </TableCell>
                      <TableCell>{promo.total_uses || 0}</TableCell>
                      <TableCell>€{(promo.total_revenue || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(promo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
            </DialogHeader>
            <PromoCodeForm
              promo={editingPromo}
              onClose={() => setIsDialogOpen(false)}
              queryClient={queryClient}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function PromoCodeForm({ promo, onClose, queryClient }) {
  const [formData, setFormData] = useState(promo || {
    name: '',
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    expiration_date: '',
    applies_to_all: true,
    product_ids: [],
    is_active: true
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (promo) {
        return base44.entities.PromoCode.update(promo.id, data);
      } else {
        return base44.entities.PromoCode.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      onClose();
    }
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const toggleProduct = (productId) => {
    const current = formData.product_ids || [];
    if (current.includes(productId)) {
      setFormData({ ...formData, product_ids: current.filter(id => id !== productId) });
    } else {
      setFormData({ ...formData, product_ids: [...current, productId] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name / Label*</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Summer Sale 2024"
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Promo Code*</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SUMMER20"
              required
            />
            <Button type="button" variant="outline" onClick={generateCode}>
              Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discount_value">Discount Value*</Label>
          <Input
            id="discount_value"
            type="number"
            min="0"
            step="0.01"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="expiration_date">Expiration Date (optional)</Label>
        <Input
          id="expiration_date"
          type="date"
          value={formData.expiration_date ? formData.expiration_date.split('T')[0] : ''}
          onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.applies_to_all}
            onCheckedChange={(checked) => setFormData({ ...formData, applies_to_all: checked })}
          />
          <Label>Apply to all products</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>Active</Label>
        </div>
      </div>

      {!formData.applies_to_all && (
        <div>
          <Label className="mb-2 block">Select Products</Label>
          <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(formData.product_ids || []).includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="rounded"
                />
                <span className="text-sm">{product.title_en || product.title_de || product.title_ru}</span>
                <span className="text-sm text-gray-500 ml-auto">${product.price}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {(formData.product_ids || []).length} products selected
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : promo ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}