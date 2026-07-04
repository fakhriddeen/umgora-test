import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Save, Store, Mail, Percent, Upload, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SellerProfile() {
  const queryClient = useQueryClient();

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

  const [formData, setFormData] = useState({
    brand_name: '',
    contact_name: '',
    phone: '',
    logo: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (seller) {
      setFormData({
        brand_name: seller.brand_name || '',
        contact_name: seller.contact_name || '',
        phone: seller.phone || '',
        logo: seller.logo || '',
      });
    }
  }, [seller]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo: result.file_url });
    } catch (err) {
      alert('Failed to upload logo');
    }
    setUploadingLogo(false);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Seller.update(seller.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <AdminLayout requireAdmin={false} requireSeller={true}>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Profile</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your seller information</p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>Update your brand details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {formData.logo ? (
                  <img src={formData.logo} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Store className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full p-2 cursor-pointer hover:opacity-80">
                  {uploadingLogo ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Click the upload icon to change your logo</p>
              </div>
            </div>

            <div>
              <Label>Brand Name</Label>
              <Input
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{seller?.email || user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Percent className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Commission Rate</p>
                <p className="font-medium">{seller?.commission_rate || 15}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Tag className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">SKU Prefix</p>
                <p className="font-medium font-mono">{seller?.sku_prefix || 'N/A'}-###</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {seller?.total_products || 0}
                </p>
                <p className="text-sm text-gray-500">Products</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{(seller?.total_sales || 0).toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}