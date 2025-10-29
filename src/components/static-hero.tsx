"use client";

import { ReactNode } from "react";

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
}: HeroSectionProps) {


  return (
    <section className={`relative py-16 bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight opacity-100 translate-y-0">
            {title.split(' ').map((word, index) => {
              if (highlightText && word.toLowerCase().includes(highlightText.toLowerCase())) {
                return (
                  <span key={index} className="inline-block">
                    <span className="text-yellow-300">
                      {word}
                    </span>
                    {index < title.split(' ').length - 1 && ' '}
                  </span>
                );
              }
              return (
                <span key={index} className="inline-block">
                  {word}
                  {index < title.split(' ').length - 1 && ' '}
                </span>
              );
            })}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-4xl mx-auto opacity-100 translate-y-0">
            {subtitle}
          </p>

          {/* Children */}
          <div className="opacity-100 translate-y-0">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
