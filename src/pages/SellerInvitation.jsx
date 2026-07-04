import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Package, ShoppingCart, TrendingUp, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SellerInvitation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['seller-invitation-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ['seller-invitation-seller', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const sellers = await base44.entities.Seller.filter({ email: user.email });
      return sellers[0] || null;
    },
    enabled: !!user?.email,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!seller?.id) return;
      return base44.entities.Seller.update(seller.id, { 
        invitation_accepted: true,
        invitation_shown: true,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-invitation-seller'] });
      navigate(createPageUrl('SellerDashboard'));
    },
  });

  // Redirect if not a seller or already accepted
  React.useEffect(() => {
    if (!userLoading && !sellerLoading) {
      if (!seller) {
        navigate(createPageUrl('Home'));
      } else if (seller.invitation_shown) {
        navigate(createPageUrl('SellerDashboard'));
      }
    }
  }, [user, seller, userLoading, sellerLoading, navigate]);

  if (userLoading || sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (!seller || seller.invitation_shown) {
    return null;
  }

  const features = [
    {
      icon: Package,
      title: 'Manage Products',
      description: 'Add, edit, and manage your product listings with ease'
    },
    {
      icon: ShoppingCart,
      title: 'Track Orders',
      description: 'View and manage orders containing your products'
    },
    {
      icon: TrendingUp,
      title: 'View Analytics',
      description: 'Access sales data and performance metrics'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
            <div className="h-20 w-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <Store className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to ÉLÉGANT!</h1>
            <p className="text-lg opacity-90">
              You've been invited to join as a seller
            </p>
          </div>

          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hello, {user?.full_name || seller.contact_name || 'there'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You've been invited to sell under the brand <strong>{seller.brand_name}</strong>.
                As a seller, you'll have access to powerful tools to manage your products and orders.
              </p>
            </div>

            <div className="grid gap-4 mb-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  'Accepting...'
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Accept Invitation & Go to Seller Panel
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                By accepting, you agree to our seller terms and conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}