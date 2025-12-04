"use client";

import React, { useState } from "react";
import { useSession } from "@/hooks/useAuth";
import { getApiToken } from "@/lib/auth-utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Users, 
  TrendingUp, 
  Star, 
  Rocket,
  Building2,
  Briefcase,
  ShoppingBag,
  GraduationCap,
  Wrench,
  Home as HomeIcon,
  Calendar,
  Wallet,
  MessageCircle,
  Award,
  Globe,
  Clock,
  BadgeCheck,
  HeartHandshake,
  Target,
  BarChart3,
  Play,
  ChevronRight,
  Quote,
  MapPin,
  Phone
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const apiToken = getApiToken();
  const [activeTab, setActiveTab] = useState<'providers' | 'clients' | 'businesses'>('providers');

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Shield className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <p className="text-slate-300 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const isAuthenticated = (status === 'authenticated' && (session || apiToken)) || apiToken;

  const platformFeatures = [
    {
      icon: <Briefcase className="w-7 h-7" />,
      title: "Professional Services",
      description: "Access 500+ service categories from verified professionals",
      color: "from-emerald-500 to-teal-600",
      link: "/marketplace",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      icon: <ShoppingBag className="w-7 h-7" />,
      title: "Supplies Marketplace",
      description: "Buy and sell equipment, materials, and business supplies",
      color: "from-blue-500 to-indigo-600",
      link: "/supplies",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      icon: <HomeIcon className="w-7 h-7" />,
      title: "Rentals",
      description: "Rent equipment, spaces, and tools for your projects",
      color: "from-amber-500 to-orange-600",
      link: "/rentals",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      icon: <GraduationCap className="w-7 h-7" />,
      title: "Academy",
      description: "Learn new skills with courses from industry experts",
      color: "from-purple-500 to-pink-600",
      link: "/academy",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      icon: <Wrench className="w-7 h-7" />,
      title: "Facility Care",
      description: "Janitorial, landscaping, pest control, and maintenance",
      color: "from-cyan-500 to-blue-600",
      link: "/facility-care",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "Job Board",
      description: "Find opportunities or hire skilled professionals",
      color: "from-rose-500 to-red-600",
      link: "/jobs",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    }
  ];

  const userTypeContent = {
    providers: {
      title: "Grow Your Service Business",
      subtitle: "Join thousands of professionals earning more on LocalPro",
      benefits: [
        { icon: <Globe className="w-5 h-5" />, text: "Reach more clients with enhanced visibility" },
        { icon: <Calendar className="w-5 h-5" />, text: "Easy booking and scheduling management" },
        { icon: <Wallet className="w-5 h-5" />, text: "Secure payments and fast withdrawals" },
        { icon: <BarChart3 className="w-5 h-5" />, text: "Analytics to track and grow your business" },
        { icon: <Award className="w-5 h-5" />, text: "Build reputation with reviews and badges" },
        { icon: <MessageCircle className="w-5 h-5" />, text: "Direct messaging with potential clients" }
      ],
      cta: "Start Offering Services",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    clients: {
      title: "Find Trusted Professionals",
      subtitle: "Book verified service providers with confidence",
      benefits: [
        { icon: <BadgeCheck className="w-5 h-5" />, text: "Verified and background-checked providers" },
        { icon: <Star className="w-5 h-5" />, text: "Transparent ratings and reviews" },
        { icon: <Shield className="w-5 h-5" />, text: "Secure payment protection" },
        { icon: <Clock className="w-5 h-5" />, text: "Instant booking and real-time updates" },
        { icon: <HeartHandshake className="w-5 h-5" />, text: "Satisfaction guarantee on services" },
        { icon: <MapPin className="w-5 h-5" />, text: "Find local professionals near you" }
      ],
      cta: "Explore Services",
      image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    businesses: {
      title: "Scale Your Operations",
      subtitle: "Enterprise solutions for hotels, agencies, and developers",
      benefits: [
        { icon: <Building2 className="w-5 h-5" />, text: "Multi-location management tools" },
        { icon: <Users className="w-5 h-5" />, text: "Team collaboration and role management" },
        { icon: <Zap className="w-5 h-5" />, text: "API access and custom integrations" },
        { icon: <BarChart3 className="w-5 h-5" />, text: "Advanced analytics and reporting" },
        { icon: <Phone className="w-5 h-5" />, text: "Dedicated account manager" },
        { icon: <Shield className="w-5 h-5" />, text: "White-label and custom branding" }
      ],
      cta: "Partner With Us",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  };

  const stats = [
    { value: "50K+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { value: "10K+", label: "Service Providers", icon: <Briefcase className="w-6 h-6" /> },
    { value: "500+", label: "Service Categories", icon: <Target className="w-6 h-6" /> },
    { value: "₱100M+", label: "Transactions", icon: <TrendingUp className="w-6 h-6" /> }
  ];

  const testimonials = [
    {
      quote: "LocalPro helped me triple my client base in just 6 months. The platform is incredibly easy to use and the support team is amazing.",
      author: "Maria Santos",
      role: "Cleaning Service Provider",
      initials: "MS",
      bgColor: "bg-emerald-500",
      rating: 5
    },
    {
      quote: "Finding reliable contractors used to be a nightmare. Now I have a trusted network of professionals just a click away.",
      author: "James Rodriguez",
      role: "Property Manager",
      initials: "JR",
      bgColor: "bg-blue-500",
      rating: 5
    },
    {
      quote: "As a hotel, we needed a scalable solution for managing multiple service vendors. LocalPro's Business Partner program is exactly what we needed.",
      author: "Ana Reyes",
      role: "Hotel Operations Director",
      initials: "AR",
      bgColor: "bg-purple-500",
      rating: 5
    }
  ];

  const currentContent = userTypeContent[activeTab];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-medium text-emerald-400">The #1 Platform for Local Services</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
              Connect. Grow.{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Succeed.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Whether you&apos;re a service provider looking to grow, a client seeking quality professionals, 
              or a business scaling operations — LocalPro is your all-in-one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href={isAuthenticated ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 group">
                  <Rocket className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="ghost" className="text-white hover:bg-slate-800/50 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-slate-600 group">
                  <Play className="mr-2 w-5 h-5" />
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 p-6 lg:p-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Type Tabs Section */}
      <section className="py-20 lg:py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Everyone
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose your path and discover how LocalPro can help you succeed
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: 'providers', label: 'Service Providers', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
              { id: 'businesses', label: 'Businesses', icon: <Building2 className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {currentContent.title}
              </h3>
              <p className="text-lg text-slate-400 mb-8">
                {currentContent.subtitle}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {currentContent.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <span className="text-slate-300 text-sm leading-relaxed">{benefit.text}</span>
                  </div>
                ))}
              </div>

              <Link href={isAuthenticated ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/30 group">
                  <Sparkles className="mr-2 w-5 h-5 text-amber-300" />
                  {currentContent.cta}
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <Image
                  src={currentContent.image}
                  alt={currentContent.title}
                  width={800}
                  height={600}
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-medium text-emerald-400">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From finding services to managing your business, LocalPro has all the tools you need
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <Link key={index} href={isAuthenticated ? feature.link : "/auth"}>
                <div className="group relative rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-emerald-500/30 transition-all duration-300 h-full overflow-hidden">
                  {/* Feature Image */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={600}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                    <div className={`absolute bottom-4 left-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                  </div>
                  {/* Feature Content */}
                  <div className="p-6">
                    <h3 className="relative text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="relative text-slate-400 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="relative flex items-center text-emerald-400 text-sm font-medium">
                      Explore <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              See what our community has to say about their experience with LocalPro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="relative p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/20 transition-colors">
                <Quote className="absolute top-6 right-6 w-10 h-10 text-emerald-500/20" />
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full ${testimonial.bgColor} flex items-center justify-center mr-4 shadow-lg`}>
                    <span className="text-white font-bold text-lg">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LocalPro Plus CTA */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8">
            <Award className="w-5 h-5 text-amber-300 mr-2" />
            <span className="text-sm font-medium text-white">LocalPro Plus</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Supercharge Your Success
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
            Unlock premium features, priority support, and advanced tools with LocalPro Plus subscriptions starting at just ₱199/month
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isAuthenticated ? "/plus" : "/auth"}>
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 group">
                <Sparkles className="mr-2 w-5 h-5" />
                Explore Plans
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-white/30">
                Compare Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Join thousands of professionals and businesses already growing with LocalPro. 
            Create your free account today.
          </p>
          <Link href={isAuthenticated ? "/dashboard" : "/auth"}>
            <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-10 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 group">
              <Rocket className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
