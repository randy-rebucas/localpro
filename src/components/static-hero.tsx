"use client";

import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  highlightText?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
}

export function HeroSection({ 
  title, 
  subtitle, 
  highlightText = "",
  badge,
  children,
  className = "",
}: HeroSectionProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-medium text-emerald-400">{badge}</span>
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            {title.split(' ').map((word, index) => {
              if (highlightText && word.toLowerCase().includes(highlightText.toLowerCase())) {
                return (
                  <span key={index}>
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      {word}
                    </span>
                    {index < title.split(' ').length - 1 && ' '}
                  </span>
                );
              }
              return (
                <span key={index}>
                  {word}
                  {index < title.split(' ').length - 1 && ' '}
                </span>
              );
            })}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {subtitle}
          </p>

          {/* Children (CTAs, etc.) */}
          {children && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
