import React, { createContext, useContext, useState, useEffect } from 'react';

const LookReferralContext = createContext();

const STORAGE_KEY = 'look_referral';
const EXPIRY_DAYS = 30;

export const LookReferralProvider = ({ children }) => {
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check expiry
        if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
          setReferral(data);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setLookReferral = (lookId, bloggerId) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
    
    const data = {
      lookId,
      bloggerId,
      source: 'look',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setReferral(data);
  };

  const clearReferral = () => {
    localStorage.removeItem(STORAGE_KEY);
    setReferral(null);
  };

  const isProductFromLook = (productId, lookProductIds = []) => {
    if (!referral || referral.source !== 'look') return false;
    return lookProductIds.includes(productId);
  };

  return (
    <LookReferralContext.Provider value={{
      referral,
      setLookReferral,
      clearReferral,
      isProductFromLook,
      hasActiveReferral: !!referral && referral.source === 'look'
    }}>
      {children}
    </LookReferralContext.Provider>
  );
};

export const useLookReferral = () => {
  const context = useContext(LookReferralContext);
  if (!context) {
    throw new Error('useLookReferral must be used within LookReferralProvider');
  }
  return context;
};