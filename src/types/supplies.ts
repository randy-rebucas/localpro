export type ProductCategory = "cleaning_supplies" | "tools" | "materials" | "equipment";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "paypal" | "paymaya";
export type SubscriptionKitCategory = "cleaning" | "maintenance" | "monthly" | "quarterly" | "custom";
export type SubscriptionKitFrequency = "weekly" | "bi-weekly" | "monthly" | "quarterly";

export interface Pricing {
  retailPrice: number;
  wholesalePrice?: number;
  currency?: string;
}

export interface Inventory {
  quantity: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
}

export interface Specifications {
  weight?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  warranty?: string;
}

export interface Coordinates {
  lat?: number;
  lng?: number;
}

export interface Location {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: Coordinates;
}

export interface ProductImage {
  url?: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

export interface DeliveryAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
}

export interface ProductOrder {
  user: string;
  quantity: number;
  totalCost: number;
  deliveryAddress?: DeliveryAddress;
  specialInstructions?: string;
  contactInfo?: ContactInfo;
  status?: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductReview {
  user: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
}

export interface Product {
  _id?: string;
  name: string;
  title: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  sku: string;
  pricing: Pricing;
  inventory: Inventory;
  specifications?: Specifications;
  location?: Location;
  images?: ProductImage[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  isSubscriptionEligible?: boolean;
  orders?: ProductOrder[];
  reviews?: ProductReview[];
  averageRating?: number;
  supplier: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionKitProduct {
  product: string;
  quantity: number;
}

export interface SubscriptionKitPricing {
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  currency?: string;
}

export interface SubscriptionKit {
  _id?: string;
  name: string;
  description: string;
  category: SubscriptionKitCategory;
  products?: SubscriptionKitProduct[];
  pricing?: SubscriptionKitPricing;
  frequency?: SubscriptionKitFrequency;
  isActive?: boolean;
  targetAudience?: string[];
  benefits?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface OrderPayment {
  status?: PaymentStatus;
  method?: PaymentMethod;
  transactionId?: string;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymayaReferenceNumber?: string;
  paymayaCheckoutId?: string;
  paymayaPaymentId?: string;
  paymayaInvoiceId?: string;
  paymayaTransactionId?: string;
  paidAt?: Date;
}

export interface Shipping {
  method?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export interface SubscriptionDetails {
  frequency?: string;
  nextDelivery?: Date;
  isActive?: boolean;
}

export interface Order {
  _id?: string;
  customer: string;
  items: OrderItem[];
  subscriptionKit?: string;
  totalAmount: number;
  currency?: string;
  shippingAddress?: ShippingAddress;
  status?: OrderStatus;
  payment?: OrderPayment;
  shipping?: Shipping;
  isSubscription?: boolean;
  subscriptionDetails?: SubscriptionDetails;
  createdAt?: Date;
  updatedAt?: Date;
}
