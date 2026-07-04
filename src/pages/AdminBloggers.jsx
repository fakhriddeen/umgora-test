import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Eye, DollarSign, ShoppingBag, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBloggers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlogger, setEditingBlogger] = useState(null);
  const [selectedBlogger, setSelectedBlogger] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagram_handle: '',
    bio: '',
    profile_image: '',
    commission_rate: 10,
    status: 'active'
  });

  const { data: bloggers = [], isLoading } = useQuery({
    queryKey: ['admin-bloggers'],
    queryFn: () => base44.entities.Blogger.list('-created_date'),
  });

  const { data: referralLogs = [] } = useQuery({
    queryKey: ['admin-referral-logs'],
    queryFn: () => base44.entities.LookReferralLog.list('-created_date'),
  });

  const { data: looks = [] } = useQuery({
    queryKey: ['admin-looks'],
    queryFn: () => base44.entities.Look.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Blogger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Blogger.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
      setIsFormOpen(false);
      setEditingBlogger(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      instagram_handle: '',
      bio: '',
      profile_image: '',
      commission_rate: 10,
      status: 'active'
    });
  };

  const handleEdit = (blogger) => {
    setEditingBlogger(blogger);
    setFormData({
      name: blogger.name || '',
      email: blogger.email || '',
      instagram_handle: blogger.instagram_handle || '',
      bio: blogger.bio || '',
      profile_image: blogger.profile_image || '',
      commission_rate: blogger.commission_rate || 10,
      status: blogger.status || 'active'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (editingBlogger) {
      updateMutation.mutate({ id: editingBlogger.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredBloggers = bloggers.filter(blogger =>
    !searchQuery ||
    blogger.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blogger.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blogger.instagram_handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBloggerStats = (bloggerId) => {
    const bloggerLooks = looks.filter(l => l.blogger_id === bloggerId);
    const bloggerLogs = referralLogs.filter(l => l.blogger_id === bloggerId);
    const totalEarnings = bloggerLogs.reduce((sum, l) => sum + (l.blogger_fee_cents || 0), 0) / 100;
    const totalPurchases = bloggerLogs.length;
    return { looks: bloggerLooks.length, earnings: totalEarnings, purchases: totalPurchases };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bloggers</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage influencer partnerships</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingBlogger(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Blogger
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bloggers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bloggers</p>
                  <p className="text-2xl font-bold">{bloggers.length}</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Looks</p>
                  <p className="text-2xl font-bold">{looks.filter(l => l.blogger_id).length}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-2xl font-bold">{referralLogs.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commissions Paid</p>
                  <p className="text-2xl font-bold">
                    €{(referralLogs.reduce((sum, l) => sum + (l.blogger_fee_cents || 0), 0) / 100).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-[#C9A96E] opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blogger</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Looks</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredBloggers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No bloggers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBloggers.map((blogger) => {
                  const stats = getBloggerStats(blogger.id);
                  return (
                    <TableRow key={blogger.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {blogger.profile_image ? (
                            <img src={blogger.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Sparkles className="h-5 w-5 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{blogger.name}</p>
                            <p className="text-sm text-gray-500">{blogger.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {blogger.instagram_handle && (
                          <span className="text-sm text-gray-600">@{blogger.instagram_handle}</span>
                        )}
                      </TableCell>
                      <TableCell>{stats.looks}</TableCell>
                      <TableCell>{stats.purchases}</TableCell>
                      <TableCell className="text-green-600 font-medium">€{stats.earnings.toFixed(2)}</TableCell>
                      <TableCell className="text-[#C9A96E] font-medium">
                        €{((blogger.balance_cents || 0) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={blogger.status === 'active' ? 'default' : 'secondary'}>
                          {blogger.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(blogger)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBlogger ? 'Edit Blogger' : 'Add Blogger'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Instagram Handle</Label>
                <Input
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="username (without @)"
                />
              </div>
              <div>
                <Label>Profile Image URL</Label>
                <Input
                  value={formData.profile_image}
                  onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.email || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}