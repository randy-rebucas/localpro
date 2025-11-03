"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useCategories } from "@/hooks/useCategories";
import { ServiceCategory } from "./categories-carousel";

interface CategoriesContextType {
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { categories, loading, error, refetch } = useCategories();

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, refetch }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategoriesContext must be used within a CategoriesProvider");
  }
  return context;
}

