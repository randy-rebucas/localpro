"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type RoleView = 'client' | 'provider';

interface RoleViewContextType {
  roleView: RoleView;
  setRoleView: (view: RoleView) => void;
  isClientView: boolean;
  isProviderView: boolean;
}

const RoleViewContext = createContext<RoleViewContextType | undefined>(undefined);

export function RoleViewProvider({ children }: { children: ReactNode }) {
  const [roleView, setRoleViewState] = useState<RoleView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roleView');
      return (saved === 'client' || saved === 'provider') ? saved : 'client';
    }
    return 'client';
  });

  // Save to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('roleView', roleView);
    }
  }, [roleView]);

  const setRoleView = (view: RoleView) => {
    setRoleViewState(view);
  };

  return (
    <RoleViewContext.Provider
      value={{
        roleView,
        setRoleView,
        isClientView: roleView === 'client',
        isProviderView: roleView === 'provider',
      }}
    >
      {children}
    </RoleViewContext.Provider>
  );
}

export function useRoleView() {
  const context = useContext(RoleViewContext);
  if (context === undefined) {
    throw new Error('useRoleView must be used within a RoleViewProvider');
  }
  return context;
}

