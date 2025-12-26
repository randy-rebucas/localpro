/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/auth/components/avatar-upload' instead.
 */
export * from '@/features/auth/components/avatar-upload';

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, RotateCw, ZoomIn, ZoomOut, User } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (file: File) => void;
  isLoading?: boolean;
  userName?: string; // Optional name for placeholder initials
}

export function AvatarUpload({ currentAvatar, onUpload, isLoading, userName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset image error when avatar changes
  useEffect(() => {
    setImageError(false);
  }, [currentAvatar]);

  // Normalize avatar URL - convert HTTP to HTTPS for Cloudinary
  const normalizeAvatarUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // Convert HTTP to HTTPS for Cloudinary URLs
    if (url.startsWith('http://res.cloudinary.com')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const normalizedAvatarUrl = normalizeAvatarUrl(currentAvatar);

  // Get initials for placeholder
  const getInitials = () => {
    if (!userName) return null;
    const names = userName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = () => {
    if (canvasRef.current && preview) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        canvas.width = 200;
        canvas.height = 200;
        
        if (ctx) {
          ctx.save();
          ctx.translate(100, 100);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -100, -100, 200, 200);
          ctx.restore();
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'avatar.png', { type: 'image/png' });
              onUpload(file);
              setShowCrop(false);
              setPreview(null);
              setRotation(0);
              setScale(1);
            }
          });
        }
      };
      
      img.src = preview;
    }
  };

  const handleCancel = () => {
    setShowCrop(false);
    setPreview(null);
    setRotation(0);
    setScale(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {/* Current Avatar Display */}
      <div className="relative group">
        {normalizedAvatarUrl && !imageError ? (
          <Image
            src={normalizedAvatarUrl}
            alt="Avatar"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 group-hover:border-accent/30 transition-colors"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-gray-200 group-hover:border-accent/30 transition-colors">
            {getInitials() ? (
              <span className="text-2xl font-semibold text-gray-600">{getInitials()}</span>
            ) : (
              <User className="w-12 h-12 text-gray-500" />
            )}
          </div>
        )}
        
        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <label className="bg-accent text-white p-2 rounded-full cursor-pointer hover:bg-accent/90 transition-colors">
            <Camera className="w-4 h-4" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* Crop Modal */}
      {showCrop && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crop Your Avatar</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={192}
                className="w-full h-48 object-contain border border-gray-200 rounded"
                style={{
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
            
            {/* Crop Controls */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation: {rotation}°
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRotation(rotation - 15)}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <RotateCw className="w-4 h-4 rotate-180" />
                  </button>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setRotation(rotation + 15)}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale: {Math.round(scale * 100)}%
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isLoading ? "Uploading..." : "Upload Avatar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden Canvas for Cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
