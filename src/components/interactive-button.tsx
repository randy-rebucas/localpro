"use client";

import { ReactNode, useState } from "react";
import { ArrowRight, Download, Play, Mail, Phone } from "lucide-react";

interface InteractiveButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: "arrow" | "download" | "play" | "mail" | "phone";
  iconPosition?: "left" | "right";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function InteractiveButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  className = "",
  onClick,
  disabled = false,
  loading = false
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = "relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent/90 text-white shadow-lg hover:shadow-xl focus:ring-ring",
    secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:ring-slate-500",
    outline: "bg-transparent hover:bg-primary/5 dark:hover:bg-primary/20 text-primary dark:text-primary border-2 border-primary dark:border-primary focus:ring-ring",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-slate-500"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl"
  };

  const getIcon = () => {
    if (!icon) return null;
    
    const iconProps = { className: "w-4 h-4" };
    
    switch (icon) {
      case "arrow": return <ArrowRight {...iconProps} />;
      case "download": return <Download {...iconProps} />;
      case "play": return <Play {...iconProps} />;
      case "mail": return <Mail {...iconProps} />;
      case "phone": return <Phone {...iconProps} />;
      default: return null;
    }
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        isPressed ? 'scale-95' : 'hover:scale-105'
      } ${loading ? 'cursor-wait' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ripple Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-inherit">
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-center space-x-2">
        {icon && iconPosition === "left" && getIcon()}
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
        {icon && iconPosition === "right" && getIcon()}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </button>
  );
}

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  className = "",
  tooltip
}: FloatingActionButtonProps) {
  return (
    <div className="relative group">
      <button
        className={`w-14 h-14 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-center">
          {icon}
        </div>
      </button>
      
      {tooltip && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

interface ProgressButtonProps {
  children: ReactNode;
  progress: number; // 0-100
  onClick?: () => void;
  className?: string;
}

export function ProgressButton({
  children,
  progress,
  onClick,
  className = ""
}: ProgressButtonProps) {
  return (
    <button
      className={`relative overflow-hidden bg-gradient-to-r from-primary to-emerald-600 hover:from-primary hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
      onClick={onClick}
    >
      {/* Progress Bar */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
