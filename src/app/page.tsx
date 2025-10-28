"use client";

import { DynamicHomeInteractive } from "@/components/dynamic-home-interactive";
import { StaticPageLayout } from "@/components/static-page-layout";
import { ScrollProgress, ScrollToTop } from "@/components/scroll-progress";
import { ParticleAnimation, FloatingElements } from "@/components/particle-animation";
import { SlideUp, FadeIn, StaggeredAnimation } from "@/components/animated-section";
import { useEffect, useState } from "react";
import { 
  CheckCircle, 
  Users, 
  Star, 
  Shield, 
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  User,
  Award,
  Globe,
  Clock,
  Target,
  Heart,
  ChevronRight,
  Sparkles,
  Rocket,
  Play,
  Mail
} from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    professionals: 0,
    services: 0,
    customers: 0,
    countries: 0
  });
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animated counters
  useEffect(() => {
    const animateCounters = () => {
      const targets = { professionals: 10000, services: 50000, customers: 100000, countries: 25 };
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setCounters({
          professionals: Math.floor(targets.professionals * progress),
          services: Math.floor(targets.services * progress),
          customers: Math.floor(targets.customers * progress),
          countries: Math.floor(targets.countries * progress)
        });

        if (step >= steps) {
          clearInterval(timer);
          setCounters(targets);
        }
      }, stepDuration);
    };

    // Start animation after a delay
    const timer = setTimeout(animateCounters, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I get started with LocalPro?",
      answer: "Simply sign up, create your professional profile, and start listing your services. Our platform guides you through the entire process with helpful tips and best practices."
    },
    {
      question: "What services can I offer on LocalPro?",
      answer: "LocalPro supports a wide range of professional services including cleaning, repairs, consulting, training, and many more. You can list multiple services and create packages."
    },
    {
      question: "How does payment processing work?",
      answer: "We offer secure payment processing with multiple options including credit cards, digital wallets, and bank transfers. Payments are processed instantly and securely."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Yes! LocalPro is fully responsive and works seamlessly on all devices. We also offer native mobile apps for iOS and Android for the best experience."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 customer support via chat, email, and phone. Our support team is trained to help with technical issues, business guidance, and platform optimization."
    },
    {
      question: "Can I use LocalPro internationally?",
      answer: "Absolutely! LocalPro operates in 25+ countries worldwide. You can expand your business globally and serve customers in different regions."
    }
  ];

  return (
    <StaticPageLayout>
      <ScrollProgress />
      <ScrollToTop />
      {/* Modern Hero Section */}
      <main>
        <section className="min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" aria-labelledby="hero-heading">
          {/* Enhanced Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-emerald-600/5"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)]"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_70%)]"></div>
          </div>
          
          {/* Enhanced Floating Elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
          
          {/* Enhanced Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="w-full h-full" style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          {/* Particle Animation */}
          <ParticleAnimation particleCount={30} />
          <FloatingElements count={12} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Enhanced Content */}
            <div className={`text-center lg:text-left space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Enhanced Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 group">
                <Sparkles className="w-4 h-4 text-emerald-500 mr-3 group-hover:animate-spin"></Sparkles>
                <span>Trusted by 10,000+ professionals worldwide</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full ml-3 animate-pulse"></div>
              </div>
              
              {/* Enhanced Typography */}
              <h1 id="hero-heading" className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tight">
                Transform Your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                  Professional
                </span>{" "}
                Journey
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-2xl">
                The ultimate Super App ecosystem that connects marketplace services, supplies, academy training, 
                finance solutions, rentals, advertising, and facility care - all in one powerful platform.
              </p>
              
              {/* Enhanced CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <DynamicHomeInteractive variant="hero" />
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center group border border-white/20">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>

              {/* Enhanced Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 pt-8">
                <div className="flex items-center bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3 group-hover:animate-pulse"></Shield>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank-Level Security</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-blue-200/50 dark:border-blue-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Globe className="w-4 h-4 text-blue-500 mr-3 group-hover:animate-pulse"></Globe>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Global Platform</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-purple-200/50 dark:border-purple-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Award className="w-4 h-4 text-purple-500 mr-3 group-hover:animate-pulse"></Award>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry Leader</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-orange-500/10 to-orange-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-orange-200/50 dark:border-orange-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Users className="w-4 h-4 text-orange-500 mr-3 group-hover:animate-pulse"></Users>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">10K+ Happy Users</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Enhanced Visual */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative z-10">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">LocalPro Dashboard</h3>
                    <p className="text-slate-600 dark:text-slate-300">Your professional command center</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <Store className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                        <h4 className="font-semibold">Marketplace</h4>
                        <p className="text-sm opacity-90">Connect & Grow</p>
                        <div className="mt-2 text-xs opacity-75">
                          <div className="flex justify-between">
                            <span>Active Listings:</span>
                            <span className="font-bold">2,847</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenue:</span>
                            <span className="font-bold">+23%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <GraduationCap className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                        <h4 className="font-semibold">Academy</h4>
                        <p className="text-sm opacity-90">Learn & Certify</p>
                        <div className="mt-2 text-xs opacity-75">
                          <div className="flex justify-between">
                            <span>Courses:</span>
                            <span className="font-bold">156</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Progress:</span>
                            <span className="font-bold">78%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <Package className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                        <h4 className="font-semibold">Supplies</h4>
                        <p className="text-sm opacity-90">Source & Stock</p>
                        <div className="mt-2 text-xs opacity-75">
                          <div className="flex justify-between">
                            <span>Inventory:</span>
                            <span className="font-bold">1,234</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Orders:</span>
                            <span className="font-bold">+45%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <Car className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                        <h4 className="font-semibold">Rentals</h4>
                        <p className="text-sm opacity-90">Rent & Use</p>
                        <div className="mt-2 text-xs opacity-75">
                          <div className="flex justify-between">
                            <span>Available:</span>
                            <span className="font-bold">89</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bookings:</span>
                            <span className="font-bold">+67%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">Total Revenue</h4>
                        <p className="text-2xl font-bold text-emerald-600">$12,450</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-300">This Month</p>
                        <p className="text-emerald-600 font-semibold">+23%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce shadow-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute top-1/4 -left-6 w-3 h-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>
        </section>
      </main>

      {/* Features Showcase Section */}
      <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <SlideUp>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Succeed
                </span>
              </h2>
            </SlideUp>
            <FadeIn delay={200}>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Our comprehensive platform provides all the tools and services you need to build, grow, and scale your professional business.
              </p>
            </FadeIn>
          </div>
          
          <StaggeredAnimation staggerDelay={150}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Marketplace */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Marketplace</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Connect with customers and grow your business through our comprehensive marketplace platform.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Service listings & bookings
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Payment processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Customer reviews
                </li>
              </ul>
            </div>
            
            {/* Academy */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Academy</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Enhance your skills with our comprehensive training programs and certifications.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Professional courses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Industry certifications
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Expert instructors
                </li>
              </ul>
            </div>
            
            {/* Supplies */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Supplies</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Source quality supplies and equipment for your business needs.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Quality suppliers
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Bulk discounts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Fast delivery
                </li>
              </ul>
            </div>
            
            {/* Rentals */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Rentals</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Rent equipment and tools for your projects without the upfront costs.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Equipment rental
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Flexible terms
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Insurance coverage
                </li>
              </ul>
            </div>
            
            {/* Advertising */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Advertising</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Promote your services and reach more customers with targeted advertising.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Targeted campaigns
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Analytics & insights
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Budget control
                </li>
              </ul>
            </div>
            
            {/* Finance */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Finance</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Manage your finances with our integrated financial tools and services.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Payment processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Financial tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-3" />
                  Tax management
                </li>
              </ul>
            </div>
          </div>
          </StaggeredAnimation>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <SlideUp>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                How{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  LocalPro
                </span>{" "}
                Works
              </h2>
            </SlideUp>
            <FadeIn delay={200}>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Get started in minutes and transform your professional journey with our simple 3-step process.
              </p>
            </FadeIn>
          </div>
          
          <StaggeredAnimation staggerDelay={200}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Create Your Profile</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Sign up and create your professional profile. Add your services, certifications, and showcase your expertise to potential customers.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Connect & Grow</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Start receiving bookings, access training programs, source supplies, and leverage our tools to grow your business exponentially.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Scale Your Business</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Use our analytics, advertising tools, and financial services to scale your business and achieve professional success.
              </p>
            </div>
          </div>
          </StaggeredAnimation>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4l12-12h2L40 14v-2zm0 4l16-16h2L40 18v-2zm0 4l20-20h2L40 22v-2zm0 4l24-24h2L40 26v-2zm0 4l28-28h2L40 30v-2zm0 4l32-32h2L40 34v-2zm0 4l36-36h2L40 38v-2zm0 4l40-40h2L40 42v-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by{" "}
              <span className="text-yellow-300">
                Professionals
              </span>{" "}
              Worldwide
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of professionals who have transformed their businesses with LocalPro.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold mb-2">
                {counters.professionals.toLocaleString()}+
              </h3>
              <p className="text-blue-100">Active Professionals</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold mb-2">
                {counters.services.toLocaleString()}+
              </h3>
              <p className="text-blue-100">Services Listed</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold mb-2">
                {counters.customers.toLocaleString()}+
              </h3>
              <p className="text-blue-100">Happy Customers</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold mb-2">
                {counters.countries}+
              </h3>
              <p className="text-blue-100">Countries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Professionals
              </span>{" "}
              Say
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Real stories from real professionals who have transformed their businesses with LocalPro.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Maria Rodriguez</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Cleaning Services</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;LocalPro has completely transformed my cleaning business. The marketplace integration and automated booking system have increased my bookings by 300%. The academy courses helped me learn new techniques and the supplies platform keeps me stocked with quality products.&quot;
              </p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">James Chen</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Home Repairs</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;The rental platform has been a game-changer for my repair business. I can access professional-grade tools without the upfront investment. The advertising features helped me reach new customers, and the finance tools make tracking payments so much easier.&quot;
              </p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Sarah Johnson</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Facility Care</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;LocalPro&apos;s facility care subscriptions saved us 40% on maintenance costs. The automated supply ordering and professional training programs have made our operations so much smoother.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Get answers to common questions about LocalPro and how it can help your business.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center justify-between group"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                      {faq.question}
                    </h3>
                    <ChevronRight 
                      className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                        expandedFAQ === index ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    expandedFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-6 pb-6">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Stay{" "}
              <span className="text-yellow-300">
                Updated
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Get the latest updates, tips, and insights delivered directly to your inbox. 
              Join our community of professionals and never miss out on new opportunities.
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-transparent"
                  />
                </div>
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center group">
                  <Mail className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Subscribe
                </button>
              </div>
              <p className="text-blue-200 text-sm mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-blue-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-yellow-300 mr-2" />
                <span className="font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-yellow-300 mr-2" />
                <span className="font-medium">10K+ Subscribers</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-300 mr-2" />
                <span>Weekly Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4l12-12h2L40 14v-2zm0 4l16-16h2L40 18v-2zm0 4l20-20h2L40 22v-2zm0 4l24-24h2L40 26v-2zm0 4l28-28h2L40 30v-2zm0 4l32-32h2L40 34v-2zm0 4l36-36h2L40 38v-2zm0 4l40-40h2L40 42v-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Professional Journey?
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Join thousands of professionals who are already using LocalPro to grow their businesses, 
              learn new skills, and connect with customers worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <DynamicHomeInteractive variant="cta" />
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-600 dark:text-slate-300">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-emerald-500 mr-2" />
                <span className="font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-medium">Global Platform</span>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 text-purple-500 mr-2" />
                <span className="font-medium">Industry Leader</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-orange-500 mr-2" />
                <span>10K+ Happy Users</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}