import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { format } from 'date-fns';
import { Zap, Eye, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  live: 'bg-green-100 text-green-800',
  ended: 'bg-red-100 text-red-800',
};

export default function SellerCampaigns() {
  const { data: user } = useQuery({
    queryKey: ['seller-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: seller } = useQuery({
    queryKey: ['seller-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const sellers = await base44.entities.Seller.filter({ email: user.email });
      return sellers[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['seller-campaigns', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return base44.entities.Campaign.filter({ seller_id: seller.id });
    },
    enabled: !!seller?.id,
  });

  return (
    <AdminLayout requireAdmin={false} requireSeller={true}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400">View campaigns featuring your products</p>
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Campaigns Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your products haven't been featured in any campaigns yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {campaign.hero_image ? (
                  <img 
                    src={campaign.hero_image} 
                    alt={campaign.name} 
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="h-12 w-12 text-white" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                    <Badge className={statusColors[campaign.status] || statusColors.draft}>
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {campaign.start_date && format(new Date(campaign.start_date), 'MMM d')}
                      {campaign.end_date && ` - ${format(new Date(campaign.end_date), 'MMM d')}`}
                    </div>
                    <span className="text-green-600 font-medium">
                      {campaign.discount_percentage}% OFF
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{campaign.product_ids?.length || 0} products</span>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {campaign.views || 0}
                      </span>
                      <span>€{(campaign.revenue || 0).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}