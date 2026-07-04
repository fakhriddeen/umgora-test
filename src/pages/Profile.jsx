import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Wallet, Mail, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Profile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Check if user is a seller
  const { data: seller } = useQuery({
    queryKey: ['seller-profile-check', user?.email?.toLowerCase()],
    queryFn: async () => {
      if (!user?.email) return null;
      // Get all sellers and match by email case-insensitively
      const allSellers = await base44.entities.Seller.list();
      const matchedSeller = allSellers.find(s => 
        s.email?.toLowerCase() === user.email.toLowerCase()
      );
      return matchedSeller || null;
    },
    enabled: !!user?.email,
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: () => base44.entities.ReferralEarning.filter({ creator_id: user.id }),
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ full_name: fullName });
    setIsEditing(false);
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.earnings, 0);
  const approvedEarnings = earnings.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.earnings, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Please login to view your profile
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  const isSeller = !!seller;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
            {t('account')}
          </h1>
          {isSeller && (
            <Link to={createPageUrl('SellerDashboard')}>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Store className="h-4 w-4 mr-2" />
                Seller Dashboard
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="earnings">Referral Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="border dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    {t('edit')}
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{user.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                      {isSeller && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Seller
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {t('save')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="earnings">
            <div className="space-y-6">
              {/* Earnings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Earnings
                    </h3>
                  </div>
                  <p className="text-2xl font-light text-gray-900 dark:text-white">
                    ${totalEarnings.toFixed(2)}
                  </p>
                </div>

                <div className="border dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Available Balance
                    </h3>
                  </div>
                  <p className="text-2xl font-light text-gray-900 dark:text-white">
                    ${approvedEarnings.toFixed(2)}
                  </p>
                </div>

                <div className="border dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending
                    </h3>
                  </div>
                  <p className="text-2xl font-light text-gray-900 dark:text-white">
                    ${(totalEarnings - approvedEarnings).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Earnings History */}
              <div className="border dark:border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-light text-gray-900 dark:text-white mb-6">
                  Earnings History
                </h2>

                {earnings.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No referral earnings yet
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Create a campaign to start earning commissions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {earnings.map((earning) => (
                      <div 
                        key={earning.id}
                        className="flex items-center justify-between border-b dark:border-gray-800 pb-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Order: {earning.order_id}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(earning.created_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Commission: {(earning.commission_rate * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-green-600">
                            +${earning.earnings.toFixed(2)}
                          </p>
                          <p className={`text-xs ${
                            earning.status === 'approved' ? 'text-green-600' :
                            earning.status === 'paid' ? 'text-blue-600' :
                            'text-yellow-600'
                          }`}>
                            {earning.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {approvedEarnings > 0 && (
                <div className="border dark:border-gray-800 rounded-lg p-6 bg-green-50 dark:bg-green-900/10">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    You have ${approvedEarnings.toFixed(2)} available for withdrawal
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Request Withdrawal
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    * Withdrawal requests are processed within 5-7 business days
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}