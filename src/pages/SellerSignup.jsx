import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Store, Package, TrendingUp, ShoppingCart, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SellerSignup() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch invitation by token
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['seller-invitation', token],
    queryFn: async () => {
      if (!token) return null;
      const invitations = await base44.entities.SellerInvitation.filter({ token, status: 'pending' });
      return invitations[0] || null;
    },
    enabled: !!token,
  });

  // Check if user is logged in
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  // Auto-redirect to login if not logged in and we have a valid token
  useEffect(() => {
    if (!userLoading && !user && token) {
      // Redirect to login, will come back to this page after
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [user, userLoading, token]);

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsAccepting(true);
    try {
      // Create seller record
      await base44.entities.Seller.create({
        user_id: user.id,
        email: user.email,
        brand_name: invitation.brand_name,
        contact_name: invitation.contact_name || user.full_name,
        commission_rate: invitation.commission_rate || 15,
        status: 'active',
        invitation_accepted: true,
        invitation_shown: true,
      });

      // Mark invitation as accepted
      await base44.entities.SellerInvitation.update(invitation.id, { status: 'accepted' });

      // Redirect to seller dashboard
      navigate(createPageUrl('SellerDashboard'));
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setIsAccepting(false);
    }
  };

  const features = [
    { icon: Package, text: 'Add and manage your own products' },
    { icon: TrendingUp, text: 'Track your sales and revenue' },
    { icon: ShoppingCart, text: 'View and fulfill orders' },
  ];

  // Loading state
  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This seller invitation link is invalid. Please contact the administrator.
          </p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Invitation not found or expired
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Invitation Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This invitation may have already been used or has expired.
          </p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // User not logged in - show loading while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check if email matches
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Email Mismatch
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            This invitation was sent to <strong>{invitation.email}</strong>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You are logged in as <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please log in with the correct email address to accept this invitation.
          </p>
          <Button variant="outline" onClick={() => base44.auth.logout()}>
            Log Out & Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Main invitation acceptance screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-center text-white">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
            <p className="text-xl">You're Invited to Become a Seller</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              You have been invited to sell on the ÉLÉGANT platform.
            </p>

            {/* Brand Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{invitation.brand_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Commission:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{invitation.commission_rate || 15}% per sale</span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-8">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">As a seller, you can:</p>
              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Accept Button */}
            <Button 
              onClick={acceptInvitation}
              disabled={isAccepting}
              className="w-full h-12 text-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                'Accept & Start Selling'
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By accepting, you agree to our seller terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}