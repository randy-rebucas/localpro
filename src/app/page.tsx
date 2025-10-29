"use client";

import { DynamicHomeInteractive } from "@/components/dynamic-home-interactive";
import { ScrollProgress, ScrollToTop } from "@/components/scroll-progress";
import { 
  CheckCircle, 
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  ArrowRight,
  Home as HomeIcon,
  Calendar,
  BookOpen,
  Wallet,
  User,
} from "lucide-react";

export default function Home() {


  const keyFeatures = [
    {
      icon: Store,
      title: "Marketplace",
      description: "Connect with customers and grow your business through our comprehensive marketplace platform.",
      features: ["Service listings & bookings", "Payment processing", "Customer reviews"]
    },
    {
      icon: GraduationCap,
      title: "Academy",
      description: "Enhance your skills with our comprehensive training programs and certifications.",
      features: ["Professional courses", "Industry certifications", "Expert instructors"]
    },
    {
      icon: Package,
      title: "Supplies",
      description: "Source quality supplies and equipment for your business needs.",
      features: ["Quality suppliers", "Bulk discounts", "Fast delivery"]
    },
    {
      icon: Car,
      title: "Rentals",
      description: "Rent equipment and tools for your projects without the upfront costs.",
      features: ["Equipment rental", "Flexible terms", "Insurance coverage"]
    },
    {
      icon: Megaphone,
      title: "Advertising",
      description: "Promote your services and reach more customers with targeted advertising.",
      features: ["Targeted campaigns", "Analytics & insights", "Budget control"]
    },
    {
      icon: CreditCard,
      title: "Finance",
      description: "Manage your finances with our integrated financial tools and services.",
      features: ["Payment processing", "Financial tracking", "Tax management"]
    }
  ];

  const staticLinks = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Help Center", href: "/help-center" },
    { name: "Security", href: "/security" },
    { name: "Careers", href: "/careers" },
    { name: "Partners", href: "/partners" },
    { name: "Community", href: "/community" },
    { name: "Blog", href: "/blog" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A5276]/85 via-[#1A5276]/75 to-[#34A853]/80"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <ScrollProgress />
        <ScrollToTop />
        
        <main className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Left Section - Main Content */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* App Name Section */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  <span className="text-[#1A5276] drop-shadow-lg">Local</span><span className="text-[#34A853] drop-shadow-lg">Pro</span>
                </h1>
                <p className="text-lg text-white max-w-xl leading-relaxed font-medium">
                  Your Trusted Local Pros - The ultimate Super App ecosystem for professionals worldwide
                </p>
              </div>

              {/* Key Features Section */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {keyFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="group">
                        <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#F5F5F5]/10 transition-all duration-300 backdrop-blur-sm">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-1.5 drop-shadow-sm">
                              {feature.title}
                            </h3>
                            <p className="text-xs text-white/90 mb-2 leading-relaxed">
                              {feature.description}
                            </p>
                            <ul className="space-y-0.5">
                              {feature.features.map((item, idx) => (
                                <li key={idx} className="flex items-center text-xs text-white/85">
                                  <CheckCircle className="w-2.5 h-2.5 text-[#34A853] mr-1.5 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Launch Date Card */}
                <div className="mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#34A853] to-[#1A5276] rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">
                        Launch Schedule
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed">
                        We're working hard to bring you the best professional services platform
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-[#34A853] rounded-full"></div>
                          <span className="text-white/85">Beta Testing: November 2025, second week</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-[#1A5276] rounded-full"></div>
                          <span className="text-white/85">Public Launch: December 2025, first week</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                          <span className="text-white/85">Mobile App: January 2026, first week</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">
                          Stay updated with our latest announcements
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Static Page Links */}
              <div className="text-left">
                {staticLinks.map((link, index) => (
                  <span key={index}>
                    <a
                      href={link.href}
                      className="text-white hover:text-white/80 underline text-sm font-medium transition-colors drop-shadow-sm"
                    >
                      {link.name}
                    </a>
                    {index < staticLinks.length - 1 && (
                      <span className="text-white/70 mx-2">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Section - iPhone Pro Max Preview */}
            <div className="lg:col-span-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* iPhone Pro Max Frame */}
                <div className="w-80 h-[640px] bg-black rounded-[3.5rem] p-3 shadow-2xl border-4 border-gray-800">
                  <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 pt-3 pb-2 text-black text-sm font-medium">
                      <span>9:58</span>
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                        </div>
                        <div className="w-6 h-3 border border-black rounded-sm">
                          <div className="w-4 h-2 bg-green-500 rounded-sm m-0.5"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Welcome Banner */}
                    <div className="bg-[#34A853] text-white text-center py-3 px-4">
                      <h2 className="text-lg font-semibold">Welcome, User</h2>
                    </div>
                    
                    {/* App Header */}
                    <div className="bg-white px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#34A853] rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-black">LocalPro</h1>
                          <p className="text-sm text-gray-500">Super App</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    
                    {/* Welcome Message */}
                    <div className="px-6 py-4">
                      <h3 className="text-2xl font-bold text-black mb-2">Welcome back, User!</h3>
                      <p className="text-gray-600 text-sm">Access all your services from one central hub</p>
                    </div>
                    
                    {/* Service Grid */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Marketplace */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                            <Store className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Marketplace</h4>
                          <p className="text-gray-500 text-xs">Buy & sell locally</p>
                        </div>
                        
                        {/* Supplies */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Supplies</h4>
                          <p className="text-gray-500 text-xs">Equipment & tools</p>
                        </div>
                        
                        {/* Academy */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                            <GraduationCap className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Academy</h4>
                          <p className="text-gray-500 text-xs">Learn & grow</p>
                        </div>
                        
                        {/* Finance */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Finance</h4>
                          <p className="text-gray-500 text-xs">Manage money</p>
                        </div>
                        
                        {/* Rentals */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-3">
                            <Car className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Rentals</h4>
                          <p className="text-gray-500 text-xs">Rent equipment</p>
                        </div>
                        
                        {/* Ads */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mb-3">
                            <Megaphone className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-black text-sm mb-1">Ads</h4>
                          <p className="text-gray-500 text-xs">Promote business</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
                      <div className="flex justify-around">
                        {/* Home Tab - Active */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-[#34A853] rounded flex items-center justify-center mb-1">
                            <HomeIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[#34A853] text-xs font-medium">Home</span>
                        </div>
                        
                        {/* Schedule Tab - Inactive */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mb-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-500 text-xs">Schedule</span>
                        </div>
                        
                        {/* Booking Tab - Inactive */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mb-1">
                            <BookOpen className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-500 text-xs">Booking</span>
                        </div>
                        
                        {/* Wallet Tab - Inactive */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mb-1">
                            <Wallet className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-500 text-xs">Wallet</span>
                        </div>
                        
                        {/* Profile Tab - Inactive */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mb-1">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-500 text-xs">Profile</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#34A853] rounded-full animate-bounce shadow-lg"></div>
                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-[#1A5276] rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute top-1/2 -left-2 w-3 h-3 bg-[#34A853] rounded-full animate-ping"></div>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}