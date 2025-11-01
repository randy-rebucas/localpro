/**
 * Image utility functions for handling placeholder images and validation
 */

/**
 * Validates if a URL is a valid image URL from trusted domains
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Allow common image domains and localhost for development
    const allowedDomains = [
      'localpro-super-app.onrender.com',
      'images.unsplash.com',
      'example.com',
      'via.placeholder.com',
      'picsum.photos',
      'api.placeholder.com',
      'placehold.co',
      'localhost',
      '127.0.0.1'
    ];
    
    return allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Generates a placeholder image URL using placehold.co
 * @param width - Image width in pixels
 * @param height - Image height in pixels (defaults to width for square)
 * @param text - Optional text to display on placeholder
 * @param backgroundColor - Optional background color (hex without #)
 * @param textColor - Optional text color (hex without #)
 * @param format - Optional image format (svg, png, jpg, webp, gif, avif)
 */
export const getPlaceholderImageUrl = (
  width: number = 32, 
  height: number = 32, 
  text?: string,
  backgroundColor?: string,
  textColor?: string,
  format: 'svg' | 'png' | 'jpg' | 'webp' | 'gif' | 'avif' = 'svg'
): string => {
  const baseUrl = 'https://placehold.co';
  const size = `${width}x${height}`;
  
  // Build the path with colors: /widthxheight/backgroundColor/textColor
  let path = `/${size}`;
  if (backgroundColor && textColor) {
    // Remove # if present
    const bgColor = backgroundColor.replace('#', '');
    const txtColor = textColor.replace('#', '');
    path = `/${size}/${bgColor}/${txtColor}`;
  } else if (backgroundColor) {
    const bgColor = backgroundColor.replace('#', '');
    path = `/${size}/${bgColor}`;
  }
  
  // Build URL with format extension
  let url = `${baseUrl}${path}`;
  if (format !== 'svg') {
    // Add format extension: .png, .jpg, etc.
    url = `${url}.${format}`;
  }
  
  // Add text as query parameter if provided
  if (text) {
    // Encode the text for URL safety, then replace %20 (encoded spaces) with + as per placehold.co docs
    const textParam = encodeURIComponent(text).replace(/%20/g, '+');
    url = `${url}?text=${textParam}`;
  }
  
  return url;
};

/**
 * Gets a safe image URL with placeholder fallback
 * @param imageUrl - The original image URL
 * @param fallbackText - Text for placeholder if image is invalid
 * @param width - Width for placeholder
 * @param height - Height for placeholder
 */
export const getSafeImageUrl = (
  imageUrl: string | null | undefined,
  fallbackText: string = 'Image',
  width: number = 32,
  height: number = 32
): string => {
  if (imageUrl && isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  return getPlaceholderImageUrl(width, height, fallbackText);
};

/**
 * Common placeholder configurations for different use cases
 */
export const PLACEHOLDER_CONFIGS = {
  avatar: {
    width: 40,
    height: 40,
    text: 'Avatar',
    backgroundColor: 'f3f4f6',
    textColor: '6b7280'
  },
  logo: {
    width: 32,
    height: 32,
    text: 'Logo',
    backgroundColor: 'f3f4f6',
    textColor: '6b7280'
  },
  portfolio: {
    width: 200,
    height: 128,
    text: 'Image',
    backgroundColor: 'f3f4f6',
    textColor: '6b7280'
  },
  thumbnail: {
    width: 64,
    height: 64,
    text: 'Thumb',
    backgroundColor: 'f3f4f6',
    textColor: '6b7280'
  }
} as const;

/**
 * Gets a placeholder image URL using predefined configurations
 */
export const getPlaceholderByType = (
  type: keyof typeof PLACEHOLDER_CONFIGS,
  customText?: string
): string => {
  const config = PLACEHOLDER_CONFIGS[type];
  return getPlaceholderImageUrl(
    config.width,
    config.height,
    customText || config.text,
    config.backgroundColor,
    config.textColor
  );
};
