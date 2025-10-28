"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sparkles, Star, Zap } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  highlightText?: string;
  gradientFrom?: string;
  gradientTo?: string;
  children?: ReactNode;
  className?: string;
  showFloatingElements?: boolean;
  showBackgroundPattern?: boolean;
}

export function HeroSection({ 
  title, 
  subtitle, 
  highlightText = "",
  gradientFrom = "from-blue-600",
  gradientTo = "to-emerald-600",
  children,
  className = "",
  showFloatingElements = true,
  showBackgroundPattern = true
}: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`relative py-20 bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white overflow-hidden ${className}`}>
      {/* Background Pattern */}
      {showBackgroundPattern && (
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      )}

      {/* Floating Elements */}
      {showFloatingElements && (
        <>
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-20 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
        </>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Badge */}
          <div className={`inline-flex items-center bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles className="w-4 h-4 text-yellow-300 mr-3 group-hover:animate-spin"></Sparkles>
            <span>Professional Platform</span>
            <div className="w-2 h-2 bg-yellow-300 rounded-full ml-3 animate-pulse"></div>
          </div>

          {/* Animated Title */}
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {title.split(' ').map((word, index) => {
              if (highlightText && word.toLowerCase().includes(highlightText.toLowerCase())) {
                return (
                  <span key={index} className="inline-block">
                    <span className="text-yellow-300 bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent animate-pulse">
                      {word}
                    </span>
                    {index < title.split(' ').length - 1 && ' '}
                  </span>
                );
              }
              return (
                <span key={index} className="inline-block hover:scale-105 transition-transform duration-300">
                  {word}
                  {index < title.split(' ').length - 1 && ' '}
                </span>
              );
            })}
          </h1>

          {/* Animated Subtitle */}
          <p className={`text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {subtitle}
          </p>

          {/* Animated Children */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {children}
          </div>

          {/* Trust Indicators */}
          <div className={`flex flex-wrap justify-center items-center gap-6 mt-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group">
              <Star className="w-4 h-4 text-yellow-300 mr-3 group-hover:animate-pulse"></Star>
              <span className="text-sm font-medium">5-Star Rated</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group">
              <Zap className="w-4 h-4 text-blue-300 mr-3 group-hover:animate-pulse"></Zap>
              <span className="text-sm font-medium">Lightning Fast</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group">
              <Sparkles className="w-4 h-4 text-emerald-300 mr-3 group-hover:animate-pulse"></Sparkles>
              <span className="text-sm font-medium">Premium Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
