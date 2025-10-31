"use client";

import React, { useState } from "react";
import { StaticPageLayout } from "@/components/static-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import {
  CheckCircle,
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Phone,
  User,
  Sparkles,
  Rocket,
  Heart,
  Award,
  Globe,
  Clock,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function Home() {
  const [expandedByIndex, setExpandedByIndex] = useState<Record<number, boolean>>({});
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleFeature = (index: number) => {
    setExpandedByIndex(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const keyFeatures = [
    {
      icon: Store,
      title: "Marketplace",
      description: "Connect with customers and grow your business through our comprehensive marketplace platform.",
      features: ["Service listings & bookings", "Payment processing", "Customer reviews"],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: GraduationCap,
      title: "Academy",
      description: "Enhance your skills with our comprehensive training programs and certifications.",
      features: ["Professional courses", "Industry certifications", "Expert instructors"],
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Package,
      title: "Supplies",
      description: "Source quality supplies and equipment for your business needs.",
      features: ["Quality suppliers", "Bulk discounts", "Fast delivery"],
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Car,
      title: "Rentals",
      description: "Rent equipment and tools for your projects without the upfront costs.",
      features: ["Equipment rental", "Flexible terms", "Insurance coverage"],
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: Megaphone,
      title: "Advertising",
      description: "Promote your services and reach more customers with targeted advertising.",
      features: ["Targeted campaigns", "Analytics & insights", "Budget control"],
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      icon: CreditCard,
      title: "Finance",
      description: "Manage your finances with our integrated financial tools and services.",
      features: ["Payment processing", "Financial tracking", "Tax management"],
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
    }
  ];

  const valuePropositions = [
    {
      icon: Zap,
      title: "All-in-One Platform",
      description: "Everything you need to run your business in one integrated ecosystem",
      color: "text-yellow-600",
    },
    {
      icon: Users,
      title: "Growing Community",
      description: "Join thousands of professionals building their businesses",
      color: "text-blue-600",
    },
    {
      icon: Shield,
      title: "Secure & Trusted",
      description: "Enterprise-grade security protecting your data and transactions",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      title: "Scale Your Business",
      description: "Tools and insights to grow your revenue and customer base",
      color: "text-purple-600",
    },
  ];

  const stats = [
    { label: "Active Users", value: "10K+", icon: Users },
    { label: "Services Listed", value: "50K+", icon: Store },
    { label: "Success Rate", value: "98%", icon: Star },
    { label: "Service Providers", value: "5K+", icon: Users },
  ];

  const popularServices = [
    { name: "Cleaning Services", icon: "🧹", color: "bg-blue-100 text-blue-700" },
    { name: "Plumbing", icon: "🔧", color: "bg-orange-100 text-orange-700" },
    { name: "Electrical", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
    { name: "Moving Services", icon: "📦", color: "bg-purple-100 text-purple-700" },
    { name: "Home Repair", icon: "🛠️", color: "bg-green-100 text-green-700" },
    { name: "Landscaping", icon: "🌿", color: "bg-emerald-100 text-emerald-700" },
  ];

  const timelineEvents = [
    {
      date: "November 2025",
      title: "Beta Testing Launch",
      description: "Second week - Early access for select users",
      status: "upcoming",
      dotColor: "bg-emerald-500",
    },
    {
      date: "December 2025",
      title: "Public Launch",
      description: "First week - Open to everyone worldwide",
      status: "upcoming",
      dotColor: "bg-blue-500",
    },
    {
      date: "January 2026",
      title: "Mobile App Release",
      description: "First week - Native iOS and Android apps",
      status: "upcoming",
      dotColor: "bg-purple-500",
    },
  ];

  const earlyAccessSchema = z.object({
    phone: z
      .string()
      .min(1, "Phone number is required")
      .transform((val) => val.trim()) // Remove leading/trailing whitespace
      .refine((phone) => {
        // Check for spaces in the phone number
        return !phone.includes(' ');
      }, "Phone number should not contain spaces")
      .refine((phone) => {
        // Remove all non-digit characters for validation
        const digits = phone.replace(/[\D\s]/g, '');
        return digits.length >= 7 && digits.length <= 15;
      }, "Phone number must be between 7 and 15 digits")
      .refine((phone) => {
        // Must start with + for international format, or be a valid number that can be formatted
        return phone.startsWith('+') || (phone.replace(/[\D\s]/g, '').length >= 7);
      }, "Please enter a valid phone number"),
    firstName: z.string().min(1, "First name is required").refine((value) => value.length > 2, {
      message: "First name must be at least 3 characters long",
    }),
    lastName: z.string().min(1, "Last name is required").refine((value) => value.length > 2, {
      message: "Last name must be at least 3 characters long",
    }),
  });

  type EarlyAccessForm = z.infer<typeof earlyAccessSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors: earlyAccessErrors },
    clearErrors,
    setValue,
  } = useForm<EarlyAccessForm>({
    resolver: zodResolver(earlyAccessSchema),
    defaultValues: {
      phone: "",
      firstName: "",
      lastName: "",
    },
    mode: "onSubmit",
  });

  // Extract register props without 'required' to prevent hydration mismatch
  const firstNameRegister = register("firstName");
  const lastNameRegister = register("lastName");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { required: _required, ...firstNameProps } = firstNameRegister;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { required: _required2, ...lastNameProps } = lastNameRegister;

  const handleEarlyAccess = async (data: EarlyAccessForm) => {
    setIsLoading(true);
    setErrors({});
    console.log("Sending early access form data:", data);
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout to allow for backend retries

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authSendCode}`, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({
          phoneNumber: data.phone.trim(),
          firstName: data.firstName,
          lastName: data.lastName,
        }),
        signal: controller.signal,
      }));

      clearTimeout(timeoutId);
      const result = await response.json();
      console.log("Send code response:", result);
      if (response.ok) {
        setPhoneNumber(data.phone);
        toast.success("Verification code sent to your phone!");
        clearErrors();
      } else {
        // Handle specific error cases
        if (response.status === 408) {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (response.status === 503) {
          const errorMsg = result.details ? `${result.error} - ${result.details}` : result.error;
          toast.error(errorMsg || "Service temporarily unavailable. Please try again in a few moments.");
        } else if (response.status === 429) {
          toast.error("Too many requests. Please wait before trying again.");
        } else {
          const errorMsg = result.details ? `${result.error} - ${result.details}` : result.error;
          toast.error(errorMsg || "Failed to send verification code");
        }
        setErrors({ phone: result.error || "Failed to send verification code" });
      }
    } catch (error) {
      console.error("Send code error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
      setErrors({ phone: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StaticPageLayout className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-emerald-400/30 shadow-lg hover:bg-emerald-500/20 transition-all">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
              <span className="text-sm font-semibold text-white">Coming Soon to the Philippines</span>
              <Rocket className="w-5 h-5 text-emerald-300" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight tracking-tight">
              <span className="block text-white mb-2">Your All-in-One</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Professional Platform
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl lg:text-3xl text-teal-100 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Connect, grow, and succeed with LocalPro—the complete ecosystem for services, supplies, training, finance, and more.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-lg px-10 py-7 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-105 border-0"
                onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join Early Access
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-emerald-400/50 text-white bg-white/10 backdrop-blur-md hover:bg-emerald-500/20 text-lg px-10 py-7 rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Features
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-teal-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Secure & Trusted</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">Made for Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Industry Leading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-20 fill-white" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,0 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              const gradients = [
                "from-purple-500 to-pink-500",
                "from-blue-500 to-cyan-500",
                "from-yellow-400 to-orange-500",
                "from-green-500 to-emerald-500",
              ];
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <CardContent className="pt-8 pb-6 text-center relative z-10">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${gradients[index]} rounded-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Popular Services */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">Most Popular</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Popular Services
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the most trusted professional services in the Philippines
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularServices.map((service, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all cursor-pointer border-2 border-gray-100 hover:border-emerald-300 group overflow-hidden relative"
                onMouseEnter={() => { }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="pt-8 pb-6 relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{service.icon}</div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{service.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Powerful Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Everything You Need
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">to Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A comprehensive suite of tools and services designed to help professionals thrive. From finding services to managing your business—we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keyFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              const isOpen = !!expandedByIndex[index];
              const colorVariants = [
                { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                { gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                { gradient: "from-orange-500 to-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
                { gradient: "from-red-500 to-red-600", bg: "bg-red-50", border: "border-red-200" },
                { gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
                { gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              ];
              const colors = colorVariants[index % colorVariants.length];
              return (
                <Card
                  key={index}
                  className={`relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 ${colors.border} shadow-lg group transform hover:-translate-y-2 ${isOpen ? 'ring-2 ring-emerald-300' : ''}`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  {/* Animated Top Border */}
                  <div className={`h-1 bg-gradient-to-r ${feature.color} relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} transform ${hoveredFeature === index ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-1000`}></div>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFeature(index)}
                        className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'}`}
                        aria-expanded={isOpen}
                      >
                        <ArrowRight
                          className={`w-5 h-5 transition-all duration-300 ${isOpen ? "rotate-90" : ""}`}
                        />
                      </button>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6 leading-relaxed text-base">{feature.description}</p>
                    <div className={`space-y-3 transition-all duration-500 overflow-hidden ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      {feature.features.map((item, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700 bg-white rounded-lg p-2 border border-gray-100">
                          <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                    {!isOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => toggleFeature(index)}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
                        >
                          Learn more
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </CardContent>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="text-sm font-semibold">Why Choose Us</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Built for Filipino
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Professionals</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              More than just a platform—connect, grow, and succeed with tools designed for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valuePropositions.map((prop, index) => {
              const IconComponent = prop.icon;
              const iconGradients = [
                "from-yellow-400 to-orange-500",
                "from-blue-400 to-cyan-500",
                "from-green-400 to-emerald-500",
                "from-purple-400 to-pink-500",
              ];
              const iconGradient = iconGradients[index % iconGradients.length];
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden text-center hover:shadow-2xl transition-all duration-500 border-0 shadow-xl group transform hover:-translate-y-3"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${iconGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                  <CardContent className="pt-10 pb-8 px-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${iconGradient} mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">{prop.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed">{prop.description}</p>
                  </CardContent>
                  <div className={`absolute inset-0 bg-gradient-to-br ${iconGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Launch Timeline Section */}
      <section className="py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-4 py-2 rounded-full mb-6">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-semibold">Roadmap</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Our Launch
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Timeline</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We&apos;re working hard to bring you the best professional services platform in the Philippines
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-12 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-400 hidden md:block transform md:-translate-x-1/2 rounded-full"></div>

            <div className="space-y-16">
              {timelineEvents.map((event, index) => {
                const dotColors = [
                  "bg-emerald-500 shadow-emerald-500/50",
                  "bg-blue-500 shadow-blue-500/50",
                  "bg-purple-500 shadow-purple-500/50",
                ];
                const dotColor = dotColors[index % dotColors.length];
                const isLeft = index % 2 === 0;
                return (
                  <div key={index} className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                    {/* Timeline Dot */}
                    <div className={`relative z-10 flex-shrink-0 w-24 h-24 ${dotColor} rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all`}>
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                      <div className={`absolute inset-0 ${dotColor} rounded-full animate-ping opacity-20`}></div>
                    </div>

                    {/* Content Card */}
                    <div className={`flex-1 ${isLeft ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'} md:w-1/2`}>
                      <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 group transform hover:-translate-y-1">
                        <div className={`h-1 bg-gradient-to-r ${isLeft ? 'from-emerald-500 to-teal-500' : 'from-teal-500 to-cyan-500'}`}></div>
                        <CardContent className="pt-6 pb-6 px-6">
                          <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:justify-end' : ''}`}>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
                              {event.date}
                            </span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">Upcoming</span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h3>
                          <p className="text-gray-600 leading-relaxed">{event.description}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="hidden md:block w-1/2"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Section */}
      <section id="early-access" className="py-24 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full mb-6 border border-emerald-400/30">
              <Rocket className="w-5 h-5 text-emerald-300" />
              <span className="text-sm font-semibold">Get Early Access</span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6">
              Be Among the
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                First
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of professionals ready to transform how services work in the Philippines. Get exclusive beta access and help shape the future.
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-xl border-white/30 shadow-2xl border-2 relative overflow-hidden">
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <CardContent className="pt-10 pb-8 px-8 md:px-12 relative z-10">
              <form onSubmit={handleSubmit(handleEarlyAccess)} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                    <Phone className="w-5 h-5" />
                    Phone Number
                  </label>

                  <PhoneInput
                    value={phoneNumber || ""}
                    onChange={(value) => {
                      setPhoneNumber(value);
                      setValue('phone', value);
                      // Clear errors when user starts typing
                      if (errors.phone) {
                        setErrors({ ...errors, phone: "" });
                      }
                      clearErrors();
                    }}
                    error={earlyAccessErrors.phone?.message || errors.phone}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-white/40 bg-white/25 backdrop-blur-md text-white placeholder-white/70 focus:ring-4 focus:ring-white/40 focus:border-white/80 outline-none transition-all text-lg"
                    autoComplete="tel"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                      <User className="w-5 h-5" />
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      {...firstNameProps}
                      required={false}
                      placeholder="Enter your first name"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-white/40 bg-white/25 backdrop-blur-md text-white placeholder-white/70 focus:ring-4 focus:ring-white/40 focus:border-white/80 outline-none transition-all text-lg"
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-white mb-3">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      {...lastNameProps}
                      required={false}
                      placeholder="Enter your last name"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-white/40 bg-white/25 backdrop-blur-md text-white placeholder-white/70 focus:ring-4 focus:ring-white/40 focus:border-white/80 outline-none transition-all text-lg"
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-xl py-7 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0"
                >
                  {isLoading ? (
                    <>
                      <Clock className="mr-2 w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Join Early Access
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-sm text-white/60 text-center pt-2">
                  By submitting, you agree to receive updates about LocalPro. We respect your privacy and will never share your information.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-teal-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">10K+ Early Joiners</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Instant Updates</span>
            </div>
          </div>
        </div>
      </section>

    </StaticPageLayout>
  );
}
