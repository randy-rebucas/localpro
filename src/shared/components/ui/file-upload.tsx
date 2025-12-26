"use client";

import React, { useRef, useState } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import { Card } from "./card";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getMaxFileSizeMB,
  getAllowedImageTypes,
  getAllowedDocumentTypes,
  getMaxImagesPerUpload,
} from "@/lib/settings-utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB, overrides app settings
  onFilesSelected?: (files: File[]) => void;
  files?: File[];
  onRemove?: (index: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  type?: "image" | "document" | "all"; // Type of files to accept
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize,
  onFilesSelected,
  files = [],
  onRemove,
  label = "Upload files",
  className = "",
  disabled = false,
  type = "all",
}: FileUploadProps) {
  const { settings: appSettings } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get settings from app settings
  const maxFileSizeMB = maxSize || getMaxFileSizeMB(appSettings);
  const allowedImageTypes = getAllowedImageTypes(appSettings);
  const allowedDocumentTypes = getAllowedDocumentTypes(appSettings);
  const maxImages = getMaxImagesPerUpload(appSettings);

  // Determine accept string based on type
  const acceptString = accept || (() => {
    switch (type) {
      case "image":
        return allowedImageTypes.join(",");
      case "document":
        return allowedDocumentTypes.join(",");
      default:
        return "*/*";
    }
  })();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check file count for images
    if (type === "image" && multiple) {
      const totalFiles = files.length + newFiles.length;
      if (totalFiles > maxImages) {
        errors.push(`Maximum ${maxImages} images allowed per upload`);
        return;
      }
    }

    newFiles.forEach((file) => {
      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        errors.push(`${file.name} exceeds maximum size of ${maxFileSizeMB}MB`);
        return;
      }

      // Check file type
      if (type === "image" && !allowedImageTypes.includes(file.type)) {
        errors.push(`${file.name} is not an allowed image type. Allowed: ${allowedImageTypes.join(", ")}`);
        return;
      }

      if (type === "document" && !allowedDocumentTypes.includes(file.type)) {
        errors.push(`${file.name} is not an allowed document type. Allowed: ${allowedDocumentTypes.join(", ")}`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      onFilesSelected?.(updatedFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? "border-ring bg-primary/5" : "border-border"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-muted-foreground/50"}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Max size: {maxFileSizeMB}MB
          {type === "image" && multiple && ` • Max ${maxImages} images`}
        </p>
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <Card key={index} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.(index);
                  }}
                  className="p-1 hover:bg-accent rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

