"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Wrench,
  Home,
  Car,
  Sparkles,
  Briefcase,
  GraduationCap,
  Heart,
  Utensils,
  Dumbbell,
  Music,
  Camera,
  Palette,
  Code,
  Stethoscope,
  Hammer,
  Paintbrush,
  Scissors,
  ShoppingBag,
  Baby,
  Dog,
  TreePine,
  Laptop,
  Settings,
  Package,
  LucideIcon
} from "lucide-react";

export interface ServiceCategory {
  key: string; // Required: category key/identifier from API (e.g., "cleaning")
  id?: string; // Optional: category ID (for backward compatibility)
  name: string; // Required: category name (e.g., "Cleaning Services")
  description?: string; // Optional: category description
  icon?: string; // Optional: icon emoji or identifier (e.g., "🧹")
  slug?: string; // Computed from name for URL-friendly identifier
  subcategories?: string[]; // Optional: subcategories list
  displayOrder?: number; // Optional: order for display/sorting
  metadata?: {
    icon?: string; // Icon identifier (e.g., "cleaning", "construction")
    color?: string; // Hex color code (e.g., "#4CAF50")
    tags?: string[]; // Array of tag strings
  };
  statistics?: {
    totalServices?: number;
    providerCount?: number;
    pricing?: {
      average: number;
      min: number;
      max: number;
      currency?: string;
    } | null;
    rating?: {
      average: number;
      totalRatings: number;
      totalReviews?: number;
    } | null;
    popularSubcategories?: Array<{
      subcategory: string;
      count: number;
    }>;
    subcategoryDistribution?: Array<{
      subcategory: string;
      count: number;
      percentage: string;
    }>;
    pricingTypeDistribution?: Array<{
      type: string;
      count: number;
      percentage: string;
    }>;
  };
}

interface CategoriesCarouselProps {
  categories: ServiceCategory[];
  onCategorySelect?: (category: ServiceCategory | null) => void;
  selectedCategoryId?: string | null;
  showDescription?: boolean;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Icon mapping function - maps category names/keys to Lucide icons
export const getCategoryIcon = (category: ServiceCategory): LucideIcon => {
  const categoryKey = (category.key || category.id || category.slug || category.name.toLowerCase().replace(/\s+/g, '-')).toLowerCase();
  const categoryName = category.name.toLowerCase();

  // Map common category names to icons
  const iconMap: Record<string, LucideIcon> = {
    // Home & Property
    'home': Home,
    'house': Home,
    'property': Home,
    'real-estate': Home,
    'cleaning': Sparkles,
    'janitorial': Sparkles,
    'maintenance': Wrench,
    'plumbing': Wrench,
    'electrical': Wrench,
    'repair': Wrench,
    'renovation': Hammer,
    'construction': Hammer,
    'painting': Paintbrush,
    'landscaping': TreePine,
    'gardening': TreePine,
    
    // Transportation
    'car': Car,
    'vehicle': Car,
    'transport': Car,
    'moving': Car,
    'delivery': Package,
    
    // Personal Care
    'beauty': Sparkles,
    'salon': Scissors,
    'hair': Scissors,
    'spa': Heart,
    'wellness': Heart,
    'fitness': Dumbbell,
    'gym': Dumbbell,
    'health': Stethoscope,
    'medical': Stethoscope,
    
    // Education & Professional
    'education': GraduationCap,
    'tutoring': GraduationCap,
    'training': GraduationCap,
    'business': Briefcase,
    'professional': Briefcase,
    'consulting': Briefcase,
    
    // Food & Entertainment
    'food': Utensils,
    'catering': Utensils,
    'restaurant': Utensils,
    'music': Music,
    'entertainment': Music,
    'photography': Camera,
    'photo': Camera,
    'video': Camera,
    'art': Palette,
    'design': Palette,
    
    // Technology
    'tech': Laptop,
    'technology': Laptop,
    'it': Laptop,
    'computer': Laptop,
    'software': Code,
    'web': Code,
    'programming': Code,
    
    // Other
    'pet': Dog,
    'pets': Dog,
    'baby': Baby,
    'childcare': Baby,
    'shopping': ShoppingBag,
    'retail': ShoppingBag,
    'settings': Settings,
    'other': Package,
  };

  // Try to find icon by category key/slug
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryKey.includes(key) || categoryName.includes(key)) {
      return icon;
    }
  }

  // Default fallback icon
  return Package;
};

export function CategoriesCarousel({
  categories,
  onCategorySelect,
  selectedCategoryId,
  showDescription = false,
  className = "",
  loading = false,
  error = null,
  onRetry,
}: CategoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const getCategoryKey = (category: ServiceCategory): string => {
    // key is required, but keep fallbacks for backward compatibility
    return category.key || category.id || category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  };

  const isCategorySelected = (category: ServiceCategory): boolean => {
    if (!selectedCategoryId) return false;
    return getCategoryKey(category) === selectedCategoryId || category.id === selectedCategoryId;
  };

  const handleCategoryClick = (category: ServiceCategory) => {
    if (onCategorySelect) {
      if (isCategorySelected(category)) {
        onCategorySelect(null);
      } else {
        onCategorySelect(category);
      }
    }
  };

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollability();
    container.addEventListener("scroll", checkScrollability);
    
    // Check on resize
    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollability);
      resizeObserver.disconnect();
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-sm text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-gray-600">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-sm text-gray-600">No categories available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left Navigation Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gradient-to-r from-white to-gray-50 rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:from-green-50 hover:to-green-100 hover:border-green-300 transition-all hover:scale-110 hover:shadow-green-200/50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700 hover:text-green-700" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex gap-3 min-w-max py-2 px-2">
          {categories.map((category) => {
            const categoryKey = getCategoryKey(category);
            const isSelected = isCategorySelected(category);

            return (
              <button
                key={categoryKey}
                onClick={() => handleCategoryClick(category)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 min-w-[130px] text-left transform hover:scale-105 ${
                  isSelected
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 shadow-lg shadow-green-200/50"
                    : "bg-gradient-to-br from-gray-50 to-white border-2 border-transparent hover:border-green-300 hover:shadow-lg hover:bg-gradient-to-br hover:from-green-50/50 hover:to-blue-50/50"
                }`}
                type="button"
              >
                {(() => {
                  const IconComponent = getCategoryIcon(category);
                  return (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-300/50' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-green-100 group-hover:to-green-200 group-hover:text-green-600'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'animate-pulse' : ''}`} />
                    </div>
                  );
                })()}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-sm font-semibold transition-colors ${
                    isSelected ? 'text-green-700' : 'text-gray-700'
                  }`}>{category.name}</span>
                  {showDescription && category.description && (
                    <span className={`text-xs text-center line-clamp-2 transition-colors ${
                      isSelected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {category.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Navigation Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gradient-to-r from-white to-gray-50 rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:from-green-50 hover:to-green-100 hover:border-green-300 transition-all hover:scale-110 hover:shadow-green-200/50"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700 hover:text-green-700" />
        </button>
      )}
    </div>
  );
}

