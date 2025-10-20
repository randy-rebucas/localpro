"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function Modal({
  children,
  isOpen = true,
  onClose,
  title,
  description,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = "lg",
  className = "",
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [closeOnEscape, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] bg-white rounded-xl shadow-2xl transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 ${className}`}
      >
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div>
                {title && (
                  <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
              {showCloseButton && onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal Header component for more complex layouts
export function ModalHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// Modal Content component
export function ModalContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// Modal Footer component
export function ModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}
