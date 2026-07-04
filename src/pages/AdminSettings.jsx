import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Save, Globe, CreditCard, Mail, Truck, Calculator, Palette, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import DesignSettings from '../components/admin/DesignSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [settings, setSettings] = useState({
    platform_name: 'ÉLÉGANT',
    tagline: 'Premium Fashion Marketplace',
    logo_url: '',
    favicon_url: '',
    contact_email: '',
    support_email: '',
    social_links: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
    },
    currency: 'EUR',
    free_shipping_threshold: 100,
    default_tax_rate: 19,
    stripe_publishable_key: 'pk_test_51SYXBA2ZoQUfdpkmkzom02IHiHBCmZCLLjHpNPlaUdMUrsD3RwEPMnFXJCR7p5NS9FjQhtvebkGorDXK9ucaqzi000AiNPJQXK',
    stripe_secret_key: '',
    stripe_currency: 'USD',
    stripe_test_mode: true,
  });

  const { data: existingSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const list = await base44.entities.PlatformSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        ...settings,
        ...existingSettings,
        social_links: {
          ...settings.social_links,
          ...existingSettings.social_links,
        },
      });
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.PlatformSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.PlatformSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Configure your platform settings</p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="design">
              <Palette className="h-4 w-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="shipping">
              <Truck className="h-4 w-4 mr-2" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="tax">
              <Calculator className="h-4 w-4 mr-2" />
              Tax
            </TabsTrigger>
          </TabsList>

          {/* Design Settings */}
          <TabsContent value="design">
            <DesignSettings />
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Information</CardTitle>
                  <CardDescription>Basic information about your platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Platform Name</Label>
                      <Input
                        value={settings.platform_name}
                        onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input
                        value={settings.tagline}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Logo URL</Label>
                      <Input
                        value={settings.logo_url}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Favicon URL</Label>
                      <Input
                        value={settings.favicon_url}
                        onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={settings.contact_email}
                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Support Email</Label>
                      <Input
                        type="email"
                        value={settings.support_email}
                        onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Connect your social media accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Facebook</Label>
                      <Input
                        value={settings.social_links?.facebook || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          social_links: { ...settings.social_links, facebook: e.target.value }
                        })}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <Label>Instagram</Label>
                      <Input
                        value={settings.social_links?.instagram || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          social_links: { ...settings.social_links, instagram: e.target.value }
                        })}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Twitter / X</Label>
                      <Input
                        value={settings.social_links?.twitter || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          social_links: { ...settings.social_links, twitter: e.target.value }
                        })}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <Label>TikTok</Label>
                      <Input
                        value={settings.social_links?.tiktok || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          social_links: { ...settings.social_links, tiktok: e.target.value }
                        })}
                        placeholder="https://tiktok.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <div className="space-y-6">
              {/* Test Mode Banner */}
              {settings.stripe_test_mode ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Test Mode Active</p>
                    <p className="text-sm text-green-600 dark:text-green-400">No real charges will be made. Use test card: 4242 4242 4242 4242</p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-800">Test</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">Live Mode - Real Payments</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Real money will be charged to customers</p>
                  </div>
                  <Badge className="ml-auto bg-orange-100 text-orange-800">Live</Badge>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Stripe Payment Configuration</CardTitle>
                  <CardDescription>Configure your Stripe payment gateway settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Publishable Key */}
                  <div>
                    <Label>Stripe Publishable Key</Label>
                    <Input
                      value={settings.stripe_publishable_key || ''}
                      onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })}
                      placeholder="pk_test_..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">This key is safe to expose in frontend code</p>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <Label>Stripe Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showSecretKey ? 'text' : 'password'}
                        value={settings.stripe_secret_key || ''}
                        onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                        placeholder="sk_test_..."
                        className="font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret - never share publicly</p>
                  </div>

                  {/* Currency */}
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={settings.stripe_currency || 'USD'}
                      onValueChange={(value) => setSettings({ ...settings, stripe_currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Test Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label className="text-base">Test Mode</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Enable test mode to use Stripe test environment
                      </p>
                    </div>
                    <Switch
                      checked={settings.stripe_test_mode ?? true}
                      onCheckedChange={(checked) => setSettings({ ...settings, stripe_test_mode: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Card Information</CardTitle>
                  <CardDescription>Use these test cards when Test Mode is enabled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                    <p className="font-mono text-sm">Card Number: <strong>4242 4242 4242 4242</strong></p>
                    <p className="font-mono text-sm">Expiry: <strong>Any future date (e.g., 12/34)</strong></p>
                    <p className="font-mono text-sm">CVC: <strong>Any 3 digits (e.g., 123)</strong></p>
                    <p className="font-mono text-sm">ZIP: <strong>Any 5 digits (e.g., 12345)</strong></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Configuration</CardTitle>
                <CardDescription>Configure shipping options and rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Free Shipping Threshold (€)</Label>
                  <Input
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Orders above this amount qualify for free shipping
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>Configure tax rates and calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.default_tax_rate}
                    onChange={(e) => setSettings({ ...settings, default_tax_rate: Number(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}