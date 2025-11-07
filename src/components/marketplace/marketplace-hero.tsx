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
  userName,
  selectedCategory,
  categories,
  categoriesLoading = false,
  categoriesError = null,
  onCategorySelect,
  onCategoriesRetry,
}: MarketplaceHeroProps) {
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Text */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {userName}, what service do you need today?
          </h1>
          <p className="text-gray-600">Find the perfect service provider for your needs</p>
        </div>

        {/* Category Carousel */}
        <CategoriesCarousel 
          categories={categories}
          loading={categoriesLoading}
          error={categoriesError}
          onRetry={onCategoriesRetry}
          onCategorySelect={onCategorySelect as (category: ServiceCategory | null) => void} 
          selectedCategoryId={selectedCategory} 
        />
      </div>
    </section>
  );
}

