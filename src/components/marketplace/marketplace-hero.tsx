"use client";

import React from "react";
import { CategoriesCarousel } from "./categories-carousel"; 
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

interface MarketplaceHeroProps {
  userName: string;
  selectedCategory: string | null;
  categories: ServiceCategory[];
  categoriesLoading?: boolean;
  categoriesError?: string | null;
  onCategorySelect: (category: ServiceCategory | undefined) => void;
  onCategoriesRetry?: () => void;
}

export function MarketplaceHero({
  userName: _userName, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedCategory,
  categories,
  categoriesLoading = false,
  categoriesError = null,
  onCategorySelect,
  onCategoriesRetry,
}: MarketplaceHeroProps) {
  return (
    <CategoriesCarousel 
      categories={categories}
      loading={categoriesLoading}
      error={categoriesError}
      onRetry={onCategoriesRetry}
      onCategorySelect={onCategorySelect as (category: ServiceCategory | null) => void} 
      selectedCategoryId={selectedCategory}
    />
  );
}

