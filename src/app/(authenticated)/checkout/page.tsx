"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  Shield,
  Truck,
  Loader2,
  ShoppingCart,
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

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  
  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash" | "card">("cod");

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', { appSettings, showSymbol: true });
  };

  // Load cart items and user profile
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cart items
        const items = JSON.parse(localStorage.getItem("cartItems") || "[]");
        if (items.length === 0) {
          router.push("/cart");
          return;
        }
        setCartItems(items);

        // Fetch user profile to auto-fill shipping info
        try {
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, createAuthFetchOptions());
          if (response.ok) {
            const data = await response.json();
            const user = data.user || data.data || data;
            
            // Extract profile and address data
            const profile = user.profile || {};
            const address = user.address || profile.address || {};
            
            // Auto-fill shipping info from user profile
            setShippingInfo({
              firstName: user.firstName || profile.firstName || "",
              lastName: user.lastName || profile.lastName || "",
              email: user.email || "",
              phone: user.phone || profile.phone || user.phoneNumber || profile.phoneNumber || "",
              address: address.street || address.address || profile.street || "",
              city: address.city || profile.city || "",
              state: address.state || address.province || profile.state || "",
              zipCode: address.zipCode || address.postalCode || profile.zipCode || "",
            });
          }
        } catch (profileError) {
          // Profile fetch failed, user will fill manually
          logger.debug("Could not auto-fill profile", { error: profileError });
        }
      } catch (error) {
        logger.error("Error loading cart", error instanceof Error ? error : new Error(String(error)));
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 150; // Free shipping over ₱5000
  const tax = subtotal * 0.12;
  const total = subtotal + shipping + tax;

  // Handle input change
  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Partial<ShippingInfo> = {};
    
    if (!shippingInfo.firstName.trim()) newErrors.firstName = "First name is required";
    if (!shippingInfo.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!shippingInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!shippingInfo.phone.trim()) newErrors.phone = "Phone is required";
    if (!shippingInfo.address.trim()) newErrors.address = "Address is required";
    if (!shippingInfo.city.trim()) newErrors.city = "City is required";
    if (!shippingInfo.state.trim()) newErrors.state = "Province is required";
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      showError("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate order ID
      const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      setOrderId(newOrderId);
      
      // Clear cart
      localStorage.setItem("cartItems", "[]");
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      
      setOrderComplete(true);
      showSuccess("Order placed successfully!");
    } catch (error) {
      logger.error("Error placing order", error instanceof Error ? error : new Error(String(error)));
      showError("Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Order Success State
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
            <p className="text-gray-600 mb-6">Thank you for your order. We&apos;ll send you a confirmation email shortly.</p>
            
            <div className="bg-emerald-50 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="text-xl font-bold text-emerald-600">{orderId}</p>
            </div>
            
            <div className="space-y-3 mb-8 text-left bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({cartItems.length})</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (12%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-emerald-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/supplies"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Package className="w-5 h-5" />
                Continue Shopping
              </Link>
              <Link
                href="/supplies/my-orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-emerald-300 hover:bg-emerald-50 transition-all"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/cart"
            className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-600">Complete your order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Shipping Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={shippingInfo.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Juan"
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={shippingInfo.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Dela Cruz"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="juan@email.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                  <input
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="123 Main Street, Barangay..."
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Manila"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province *</label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Metro Manila"
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      value={shippingInfo.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="1000"
                    />
                    {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "cod" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-sm text-gray-500">Pay when you receive your order</p>
                  </div>
                  <Package className="w-6 h-6 text-gray-400" />
                </label>
                
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "gcash" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "gcash"}
                    onChange={() => setPaymentMethod("gcash")}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">GCash</p>
                    <p className="text-sm text-gray-500">Pay via GCash mobile wallet</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">G</div>
                </label>
                
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "card" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Credit / Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, and more</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Order Summary
              </h3>
              
              {/* Cart Items */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : ''}`}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                {subtotal < 5000 && (
                  <p className="text-xs text-gray-500">Add {formatPrice(5000 - subtotal)} more for free shipping!</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (12%)</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
              </div>
              
              <div className="border-t-2 border-gray-100 mt-4 pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatPrice(total)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

