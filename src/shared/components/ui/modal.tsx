"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  footer,
  className = "",
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add custom scrollbar styles for webkit browsers
  useEffect(() => {
    if (!shouldRender) return;
    
    const styleId = 'modal-scrollbar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .modal-content-scroll::-webkit-scrollbar {
        width: 8px;
      }
      .modal-content-scroll::-webkit-scrollbar-track {
        background: hsl(var(--muted));
        border-radius: 4px;
      }
      .modal-content-scroll::-webkit-scrollbar-thumb {
        background: hsl(var(--border));
        border-radius: 4px;
      }
      .modal-content-scroll::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground));
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [shouldRender]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure the element is in the DOM before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !shouldRender || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-end backdrop-blur-sm bg-black/20 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-background text-foreground shadow-xl h-screen flex flex-col transform transition-transform duration-300 ease-out ${sizeClasses[size]} ${className} ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: size === 'full' ? '100%' : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background flex-shrink-0">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-accent-foreground"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div 
          className="flex-1 overflow-y-auto px-4 py-3 text-foreground leading-normal text-sm antialiased modal-content-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--border)) hsl(var(--muted))'
          }}
        >
          {children}
        </div>
        {footer && <div className="px-4 py-3 border-t border-border bg-muted/30 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );

  // Render modal directly to document.body using portal to ensure it's on top
  return createPortal(modalContent, document.body);
}
