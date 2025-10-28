import { ReactNode } from "react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  highlightText?: string;
  gradientFrom?: string;
  gradientTo?: string;
  children?: ReactNode;
  className?: string;
}

export function HeroSection({ 
  title, 
  subtitle, 
  highlightText = "",
  gradientFrom = "from-blue-600",
  gradientTo = "to-emerald-600",
  children,
  className = ""
}: HeroSectionProps) {
  return (
    <section className={`py-20 bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {title.split(' ').map((word, index) => {
              if (highlightText && word.toLowerCase().includes(highlightText.toLowerCase())) {
                return (
                  <span key={index}>
                    <span className="text-yellow-300">{word}</span>
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
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            {subtitle}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
