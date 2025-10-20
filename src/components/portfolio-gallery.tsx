"use client";

import { useState } from "react";
import { Upload, X, Eye, Download, ExternalLink, Plus, Grid, List } from "lucide-react";
import Image from "next/image";

interface PortfolioGalleryProps {
  portfolio: string[];
  onUpload: (files: File[]) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
}

export function PortfolioGallery({ portfolio, onUpload, onDelete, isLoading }: PortfolioGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Portfolio Gallery</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-green-400 bg-green-50' 
            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Drag and drop images here, or</p>
        <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Choose Files
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Supports JPG, PNG, WebP up to 10MB each
        </p>
      </div>

      {/* Portfolio Grid/List */}
      {portfolio.length > 0 && (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
            : 'space-y-4'
        }`}>
          {portfolio.map((image, index) => (
            <div
              key={index}
              className={`group relative ${
                viewMode === 'list' ? 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg' : ''
              }`}
            >
              {viewMode === 'grid' ? (
                <div className="aspect-square relative overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      <button
                        onClick={() => setSelectedImage(image)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => window.open(image, '_blank')}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => onDelete(index)}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Image
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Portfolio Image {index + 1}</p>
                    <p className="text-sm text-gray-500">Click to view full size</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedImage(image)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(index)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <Image
              src={selectedImage}
              alt="Portfolio"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <button
                onClick={() => window.open(selectedImage, '_blank')}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage;
                  link.download = `portfolio-${Date.now()}.jpg`;
                  link.click();
                }}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Uploading images...</p>
        </div>
      )}
    </div>
  );
}
