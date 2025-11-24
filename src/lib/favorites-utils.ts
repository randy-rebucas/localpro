/**
 * Favorites utility functions for use across the application
 * 
 * Item Type to Data Model Mapping:
 * - 'service' → Marketplace Service (uses /api/marketplace/services)
 * - 'provider' → Provider (uses /api/providers)
 * - 'course' → Course (uses /api/academy/courses)
 * - 'supply' → Product (uses /api/supplies/products)
 */

import { API_BASE_URL, API_ENDPOINTS } from "./api";
import { createAuthFetchOptions } from "./auth-utils";
import { logger } from "./logger";
import toast from "react-hot-toast";

export type ItemType = 'service' | 'provider' | 'course' | 'supply';

export interface FavoritePayload {
  itemType: ItemType;
  itemId: string;
  notes?: string;
  tags?: string[];
}

/**
 * Get the API endpoint for fetching an item by type and ID
 * @param itemType - The type of item ('service' | 'provider' | 'course' | 'supply')
 * @param itemId - The ID of the item
 * @returns The API endpoint path
 */
export function getItemEndpoint(itemType: ItemType, itemId: string): string {
  switch (itemType) {
    case 'service':
      // Marketplace Service
      return `${API_ENDPOINTS.marketplaceServiceById}/${itemId}`;
    case 'provider':
      // Provider
      return `${API_ENDPOINTS.providersById.replace('[id]', itemId)}`;
    case 'course':
      // Course
      return `${API_ENDPOINTS.academyCoursesById}/${itemId}`;
    case 'supply':
      // Product (from supplies/products)
      return `${API_ENDPOINTS.suppliesProductsById.replace('[id]', itemId)}`;
  }
}

/**
 * Add an item to favorites
 */
export async function addFavorite(
  itemType: ItemType,
  itemId: string,
  notes?: string,
  tags?: string[]
): Promise<void> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.favorites}`;
    const response = await fetch(url, createAuthFetchOptions({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemType,
        itemId,
        notes,
        tags
      })
    }));

    if (!response.ok) {
      throw new Error('Failed to add favorite');
    }

    toast.success('Added to favorites');
    
    // Dispatch custom event for header to update
    window.dispatchEvent(new Event('favoritesUpdated'));
  } catch (error) {
    logger.error('Error adding favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
    toast.error('Failed to add favorite');
    throw error;
  }
}

/**
 * Remove an item from favorites
 */
export async function removeFavorite(
  itemType: ItemType,
  itemId: string
): Promise<void> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesByItem}/${itemType}/${itemId}`;
    const response = await fetch(url, createAuthFetchOptions({
      method: 'DELETE'
    }));

    if (!response.ok) {
      throw new Error('Failed to remove favorite');
    }

    toast.success('Removed from favorites');
    
    // Dispatch custom event for header to update
    window.dispatchEvent(new Event('favoritesUpdated'));
  } catch (error) {
    logger.error('Error removing favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
    toast.error('Failed to remove favorite');
    throw error;
  }
}

/**
 * Check if an item is favorited
 */
export async function checkFavorite(
  itemType: ItemType,
  itemId: string
): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesCheck}/${itemType}/${itemId}`;
    const response = await fetch(url, createAuthFetchOptions());
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isFavorited || false;
  } catch (error) {
    logger.error('Error checking favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  itemType: ItemType,
  itemId: string,
  notes?: string,
  tags?: string[]
): Promise<boolean> {
  try {
    const isFavorited = await checkFavorite(itemType, itemId);
    
    if (isFavorited) {
      await removeFavorite(itemType, itemId);
      return false;
    } else {
      await addFavorite(itemType, itemId, notes, tags);
      return true;
    }
  } catch (error) {
    logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
    throw error;
  }
}

