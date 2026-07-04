import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const UIStateContext = createContext(null);

export function UIStateProvider({ children }) {
  const [lookSidebarOpen, setLookSidebarOpen] = useState(false);
  const [selectedLook, setSelectedLook] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname + location.search);

  // Close ALL overlays on ANY route change - this is critical for navigation
  useEffect(() => {
    const currentLocation = location.pathname + location.search;
    if (prevLocationRef.current !== currentLocation) {
      prevLocationRef.current = currentLocation;
      // Close everything immediately and reset body scroll
      setLookSidebarOpen(false);
      setSelectedLook(null);
      setCartOpen(false);
      setMobileMenuOpen(false);
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
  }, [location.pathname, location.search]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Control body scroll when ANY overlay is open
  useEffect(() => {
    const anyOpen = lookSidebarOpen || cartOpen || mobileMenuOpen;
    if (anyOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [lookSidebarOpen, cartOpen, mobileMenuOpen]);

  const openLookSidebar = useCallback((look) => {
    // Close other overlays first
    setCartOpen(false);
    setMobileMenuOpen(false);
    setSelectedLook(look);
    setLookSidebarOpen(true);
  }, []);

  const closeLookSidebar = useCallback(() => {
    setLookSidebarOpen(false);
    setSelectedLook(null);
    document.body.style.overflow = '';
  }, []);

  const openCart = useCallback(() => {
    setLookSidebarOpen(false);
    setSelectedLook(null);
    setMobileMenuOpen(false);
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openMobileMenu = useCallback(() => {
    setLookSidebarOpen(false);
    setSelectedLook(null);
    setCartOpen(false);
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  const closeAll = useCallback(() => {
    setLookSidebarOpen(false);
    setSelectedLook(null);
    setCartOpen(false);
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }, []);

  return (
    <UIStateContext.Provider value={{
      lookSidebarOpen,
      selectedLook,
      cartOpen,
      mobileMenuOpen,
      openLookSidebar,
      closeLookSidebar,
      openCart,
      closeCart,
      openMobileMenu,
      closeMobileMenu,
      closeAll,
    }}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}