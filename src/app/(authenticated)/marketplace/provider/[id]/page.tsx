"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Share2, MessageSquare } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useProvider } from "@/hooks/useProviders";
import { ProviderDetail } from "@/components/detail/provider-detail";
import { checkFavorite, toggleFavorite } from "@/lib/favorites-utils";
import { useSession } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const providerId = params?.id as string;

  const { provider, loading, error, refetch } = useProvider(providerId);
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if provider is favorited
  React.useEffect(() => {
    if (provider && providerId) {
      const checkFav = async () => {
        try {
          const favorited = await checkFavorite("provider", providerId);
          setIsFavorite(favorited);
        } catch (err) {
          logger.error("Error checking favorite", err instanceof Error ? err : new Error(String(err)));
        }
      };
      checkFav();
    }
  }, [provider, providerId]);

  const handleFavorite = useCallback(async () => {
    if (!providerId) {
      toast.error("Provider ID is missing");
      return;
    }

    try {
      const newFavoriteState = await toggleFavorite("provider", providerId);
      setIsFavorite(newFavoriteState);
      toast.success(newFavoriteState ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      logger.error("Error toggling favorite", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to update favorite");
    }
  }, [providerId]);

  const handleContact = useCallback(() => {
    if (provider?.businessInfo?.businessEmail) {
      window.location.href = `mailto:${provider.businessInfo.businessEmail}`;
    } else if (provider?.businessInfo?.businessPhone) {
      window.location.href = `tel:${provider.businessInfo.businessPhone}`;
    } else {
      // Navigate to messages if available
      router.push(`/messages?provider=${providerId}`);
    }
  }, [provider, providerId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "The provider you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/marketplace/providers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/marketplace/providers"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Providers</span>
          </Link>
        </div>

        {/* Provider Detail Component */}
        <ProviderDetail
          provider={provider}
          onContact={handleContact}
          onFavorite={handleFavorite}
        />
      </div>
    </div>
  );
}

