"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Star, Package, ShoppingCart, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/supplies";
import { formatCurrency } from "@/lib/currency-utils";

interface SupplyCardProps {
  supply: Product;
  viewMode?: "grid" | "list";
  onAddToCart?: (supplyId: string) => void;
  onFavorite?: (supplyId: string) => void;
}

export function SupplyCard({ supply, viewMode = "list", onAddToCart, onFavorite }: SupplyCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row"}`}>
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => onFavorite?.(supply._id || "")}
          className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-pink-500" />
        </button>
        <button className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className={isGrid ? "" : "flex gap-4 flex-1"}>
        {supply.images && supply.images.length > 0 && (
          <div className={isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"}>
            <Image
              src={supply.images[0].url || "/placeholder.png"}
              alt={supply.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        {(!supply.images || supply.images.length === 0) && (
          <div className={`${isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"} bg-gray-200 flex items-center justify-center`}>
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{supply.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{supply.description}</p>
            </div>
            {supply.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{supply.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {supply.category && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mb-2">
              {supply.category}
            </span>
          )}

          {supply.pricing && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {formatCurrency(supply.pricing.retailPrice, 'PHP')}
                  {supply.pricing.wholesalePrice && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Wholesale: {formatCurrency(supply.pricing.wholesalePrice, 'PHP')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {supply.inventory && (
            <div className="text-sm text-gray-600 mb-2">
              <span className={supply.inventory.quantity > 0 ? "text-green-600" : "text-red-600"}>
                {supply.inventory.quantity > 0 ? `In Stock (${supply.inventory.quantity})` : "Out of Stock"}
              </span>
            </div>
          )}

          {supply.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{supply.location.city}, {supply.location.state}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/supplies/${supply._id}`)}
            >
              View Details
            </Button>
            {onAddToCart && supply.inventory && supply.inventory.quantity > 0 && (
              <Button
                size="sm"
                onClick={() => onAddToCart(supply._id || "")}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

