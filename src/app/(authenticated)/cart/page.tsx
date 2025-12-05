"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  ShoppingBag,
  CreditCard,
  Shield,
  Truck,
  CheckCircle2,
} from "lucide-react";

interface CartItem {
  id: string;
  itemType: "supply" | "rental" | "course";
  itemId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
  sellerId?: string;
  sellerName?: string;
}

export default function CartPage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', { appSettings, showSymbol: true });
  };

  // Load cart items from localStorage
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("cartItems") || "[]");
      setCartItems(items);
    } catch (error) {
      logger.error("Error loading cart items", error instanceof Error ? error : new Error(String(error)));
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save cart items to localStorage
  const saveCart = useCallback((items: CartItem[]) => {
    localStorage.setItem("cartItems", JSON.stringify(items));
    // Dispatch event to update header cart count
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const maxQty = item.maxQuantity || 99;
          const qty = Math.max(1, Math.min(newQuantity, maxQty));
          return { ...item, quantity: qty };
        }
        return item;
      });
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveCart(updated);
      showSuccess("Item removed from cart");
      return updated;
    });
  }, [saveCart, showSuccess]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCart([]);
    showSuccess("Cart cleared");
  }, [saveCart, showSuccess]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showError("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/supplies"
            className="p-2.5 hover:bg-slate-800 rounded-lg transition-all border-2 border-transparent hover:border-slate-700"
            title="Continue shopping"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
            <p className="text-sm text-slate-400">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all border-2 border-transparent hover:border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Your cart is empty</h2>
              <p className="text-slate-400 mb-8">
                Looks like you haven&apos;t added any items to your cart yet. Browse our supplies and add items to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/supplies"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transition-all"
                >
                  <Package className="w-5 h-5" />
                  Browse Supplies
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-700 text-slate-300 rounded-lg font-medium hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Visit Marketplace
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 rounded-xl border border-slate-800 hover:border-emerald-500/50 shadow-lg hover:shadow-xl transition-all p-4"
                >
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <Link
                      href={`/${item.itemType === "supply" ? "supplies" : item.itemType === "rental" ? "rentals" : "academy/courses"}/${item.itemId}`}
                      className="w-28 h-28 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 group"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={112}
                          height={112}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-slate-600" />
                        </div>
                      )}
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${item.itemType === "supply" ? "supplies" : item.itemType === "rental" ? "rentals" : "academy/courses"}/${item.itemId}`}
                        className="font-bold text-white hover:text-emerald-400 transition-colors line-clamp-2 text-lg"
                      >
                        {item.name}
                      </Link>
                      {item.sellerName && (
                        <p className="text-sm text-slate-400 mt-1">
                          Sold by: <span className="font-medium text-slate-300">{item.sellerName}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium capitalize">
                          {item.itemType}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-emerald-400 mt-3">
                        {formatPrice(item.price)}
                        <span className="text-sm font-normal text-slate-500"> / unit</span>
                      </p>
                    </div>

                    {/* Quantity Controls & Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-slate-700 text-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                            className="p-2 hover:bg-slate-700 text-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Order Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal ({cartItems.length} items)</span>
                    <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">VAT (12%)</span>
                    <span className="font-semibold text-white">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shipping</span>
                    <span className="font-medium text-emerald-400">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 mt-6 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">{formatPrice(total)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl transition-all"
                  >
                    Proceed to Checkout
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Quality Assured</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span>Easy Returns</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                  Secure checkout powered by LocalPro
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
