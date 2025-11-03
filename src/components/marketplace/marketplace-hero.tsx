"use client";

import React from "react";
import { CategoriesCarousel } from "./categories-carousel"; 
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { CategoryStatistics } from "./category-statistics";
import { useCategoriesContext } from "./categories-context";

interface MarketplaceHeroProps {
  userName: string;
  selectedCategory: string | null;
  onCategorySelect: (category: ServiceCategory | undefined) => void;
}

export function MarketplaceHero({
  userName,
  selectedCategory,
  onCategorySelect,
}: MarketplaceHeroProps) {
  const { categories } = useCategoriesContext();
  
  // Find the selected category object
  const selectedCategoryObj = selectedCategory 
    ? categories.find((cat) => {
        const key = cat.key || cat.id || cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
        return key === selectedCategory;
      })
    : null;

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
        <CategoriesCarousel onCategorySelect={onCategorySelect as (category: ServiceCategory | null) => void} selectedCategoryId={selectedCategory} />
        
        {/* Category Statistics */}
        {selectedCategoryObj && <CategoryStatistics category={selectedCategoryObj} />}
      </div>
    </section>
  );
}

