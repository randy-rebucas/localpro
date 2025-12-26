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
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-gray-600">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
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
      <div className={`flex items-center justify-center ${className}`}>
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-accent/5 hover:border-accent/30 transition-all hover:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex gap-2 min-w-max py-1 px-1">
          {categories.map((category) => {
            const categoryKey = getCategoryKey(category);
            const isSelected = isCategorySelected(category);
            const IconComponent = getCategoryIcon(category);

            return (
              <button
                key={categoryKey}
                onClick={() => handleCategoryClick(category)}
                className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? "bg-gradient-to-r from-accent to-accent text-white shadow-lg shadow-green-500/30 border-2 border-accent"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-accent hover:bg-accent/5 hover:shadow-md"
                }`}
                type="button"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 group-hover:bg-accent/10'
                }`}>
                  <IconComponent className={`w-4 h-4 ${
                    isSelected ? 'text-white' : 'text-gray-600 group-hover:text-accent'
                  }`} />
                </div>
                <span className={`text-sm font-semibold ${
                  isSelected ? 'text-white' : 'text-gray-700 group-hover:text-accent'
                }`}>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Navigation Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-accent/5 hover:border-accent/30 transition-all hover:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}

