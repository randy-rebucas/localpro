"use client";

import { useState, useEffect } from "react";

interface UseRoleViewOptions {
  userRoles: string[];
}

export function useRoleView({ userRoles }: UseRoleViewOptions) {
  // Role view state - sync with localStorage
  const [roleView, setRoleView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roleView');
      if (saved && userRoles.length > 0 && userRoles.includes(saved)) {
        return saved;
      }
    }
    return userRoles.length > 0 ? (userRoles.includes('client') ? 'client' : userRoles[0]) : 'client';
  });

  // Update roleView when userRoles change or when localStorage changes
  useEffect(() => {
    if (userRoles.length > 0) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('roleView');
        if (saved && userRoles.includes(saved)) {
          setRoleView(saved);
        } else if (!userRoles.includes(roleView)) {
          setRoleView(userRoles.includes('client') ? 'client' : userRoles[0]);
        }
      }
    }
  }, [userRoles, roleView]);

  // Listen for roleView changes from role switcher
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRoleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ roleView: string }>;
      if (customEvent.detail?.roleView && userRoles.includes(customEvent.detail.roleView)) {
        setRoleView(customEvent.detail.roleView);
      }
    };

    const handleStorageChange = () => {
      const saved = localStorage.getItem('roleView');
      if (saved && userRoles.includes(saved)) {
        setRoleView(saved);
      }
    };

    window.addEventListener('roleViewChanged', handleRoleViewChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('roleViewChanged', handleRoleViewChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userRoles]);

  // Determine if we're in client or provider view
  const isClientView = roleView === 'client';
  const isProviderView = roleView !== 'client' && ['provider', 'agency_owner', 'agency_admin', 'admin'].includes(roleView);

  return {
    roleView,
    setRoleView,
    isClientView,
    isProviderView,
  };
}

