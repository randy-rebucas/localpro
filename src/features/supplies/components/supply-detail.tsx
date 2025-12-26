"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Package,
  ShoppingCart,
  Heart,
  Share2,
  Edit,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/supplies";
import { useSession } from "@/hooks/useAuth";

interface SupplyDetailProps {
  supply: Product;
  onAddToCart?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
}

export function SupplyDetail({ supply, onAddToCart, onEdit, onFavorite }: SupplyDetailProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === supply.supplier;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Images */}
        <div className="md:w-1/2">
          {supply.images && supply.images.length > 0 ? (
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={supply.images[0].url || "/placeholder.png"}
                alt={supply.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-1/2 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{supply.name}</h1>
              <div className="flex gap-2">
                <button
                  onClick={onFavorite}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <p className="text-gray-600">{supply.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {supply.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {supply.category}
              </span>
            )}
            {supply.subcategory && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                {supply.subcategory}
              </span>
            )}
            {supply.brand && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {supply.brand}
              </span>
            )}
            {supply.isActive && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>

          {supply.averageRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(supply.averageRating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{supply.averageRating.toFixed(1)}</span>
              {supply.reviews && (
                <span className="text-gray-600">
                  ({supply.reviews.length} reviews)
                </span>
              )}
            </div>
          )}

          {supply.pricing && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                ₱{supply.pricing.retailPrice}
              </span>
              {supply.pricing.wholesalePrice && (
                <span className="text-lg text-gray-500">
                  (Wholesale: ₱{supply.pricing.wholesalePrice})
                </span>
              )}
            </div>
          )}

          {supply.inventory && (
            <div className={`p-4 rounded-lg ${
              supply.inventory.quantity > 0
                ? "bg-accent/5 border border-accent/20"
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                {supply.inventory.quantity > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {supply.inventory.quantity > 0
                      ? `In Stock (${supply.inventory.quantity} available)`
                      : "Out of Stock"}
                  </p>
                  {supply.inventory.minStock && supply.inventory.quantity <= supply.inventory.minStock && (
                    <p className="text-sm text-yellow-600">Low stock warning</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {supply.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>
                {supply.location.city}, {supply.location.state}
              </span>
            </div>
          )}

          {supply.sku && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">SKU:</span> {supply.sku}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onAddToCart && !isOwner && supply.inventory && supply.inventory.quantity > 0 && (
              <Button onClick={onAddToCart} size="lg" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            )}
            {onEdit && isOwner && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supply.specifications && Object.keys(supply.specifications).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="space-y-2">
              {Object.entries(supply.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {supply.inventory && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Inventory Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-semibold">{supply.inventory.quantity}</span>
              </div>
              {supply.inventory.minStock && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Stock</span>
                  <span className="font-semibold">{supply.inventory.minStock}</span>
                </div>
              )}
              {supply.inventory.maxStock && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Stock</span>
                  <span className="font-semibold">{supply.inventory.maxStock}</span>
                </div>
              )}
              {supply.inventory.location && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold">{supply.inventory.location}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {supply.pricing && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Retail Price</span>
                <span className="font-semibold">₱{supply.pricing.retailPrice}</span>
              </div>
              {supply.pricing.wholesalePrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Wholesale Price</span>
                  <span className="font-semibold">₱{supply.pricing.wholesalePrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Currency</span>
                <span className="font-semibold">{supply.pricing.currency || "PHP"}</span>
              </div>
            </div>
          </Card>
        )}

        {supply.tags && supply.tags.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {supply.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

