"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useMobileGestures } from "@/hooks/use-mobile-gestures";

interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export function MobileCard({
  children,
  onClick,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  className,
  disabled = false,
  hapticFeedback = true
}: MobileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const { bind } = useMobileGestures({
    onTap: () => {
      if (!disabled && onClick) {
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
        onClick();
      }
    },
    onLongPress: () => {
      if (!disabled && onLongPress) {
        setIsLongPressed(true);
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress();
        setTimeout(() => setIsLongPressed(false), 150);
      }
    },
    onSwipeLeft,
    onSwipeRight,
    enabled: !disabled
  });

  // Bind gesture handlers to the card element
  React.useEffect(() => {
    bind(cardRef.current);
  }, [bind]);

  const handlePointerDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-150 ease-out",
        "min-h-[44px] touch-manipulation", // Minimum touch target
        "active:scale-[0.98] active:shadow-none", // Touch feedback
        disabled && "opacity-50 cursor-not-allowed",
        isPressed && "scale-[0.98] shadow-none bg-gray-50",
        isLongPressed && "ring-2 ring-blue-500 ring-opacity-50",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{
        WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitUserSelect: 'none', // Prevent text selection
        userSelect: 'none'
      }}
    >
      {children}

      {/* Optional ripple effect for touch feedback */}
      {isPressed && (
        <div className="absolute inset-0 rounded-lg bg-black bg-opacity-5 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

// Specialized mobile list item
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MobileListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  badge,
  onClick,
  onLongPress,
  disabled = false,
  className
}: MobileListItemProps) {
  return (
    <MobileCard
      onClick={onClick}
      onLongPress={onLongPress}
      disabled={disabled}
      className={cn("p-4", className)}
    >
      <div className="flex items-center space-x-3">
        {/* Left Icon */}
        {leftIcon && (
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate pr-2">
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Icon */}
        {rightIcon && (
          <div className="flex-shrink-0 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    </MobileCard>
  );
}

// Mobile action button grid
interface MobileActionGridProps {
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: string | number;
  }>;
  columns?: number;
  className?: string;
}

export function MobileActionGrid({
  actions,
  columns = 4,
  className
}: MobileActionGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 p-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        columns === 5 && "grid-cols-5",
        className
      )}
    >
      {actions.map((action, index) => (
        <MobileCard
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex flex-col items-center justify-center p-3 min-h-[72px]"
        >
          <div className="relative mb-2">
            <div className="w-8 h-8 text-gray-600">
              {action.icon}
            </div>
            {action.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                {action.badge}
              </span>
            )}
          </div>
          <span className="text-xs text-center text-gray-700 font-medium leading-tight">
            {action.label}
          </span>
        </MobileCard>
      ))}
    </div>
  );
}
