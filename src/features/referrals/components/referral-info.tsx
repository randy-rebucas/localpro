"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  Gift, 
  Info, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Mail, 
  Share2 
} from "lucide-react";
import type { UserProfileData } from "@/features/auth/components/user-profile";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { CLIENT_CONFIG } from "@/lib/env";
import { logger } from "@/lib/logger";

interface ReferralInfoProps {
  profile: UserProfileData | null;
}

export function ReferralInfo({ profile }: ReferralInfoProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  // Generate referral link
  const referralLink = useMemo(() => {
    if (!profile?.referral?.referralCode) return null;
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : CLIENT_CONFIG.appUrl || 'http://localhost:3000';
    return `${baseUrl}/signup?ref=${profile.referral.referralCode}`;
  }, [profile?.referral?.referralCode]);

  // Track referral share (optional - tracks when link is shared)
  const trackReferralShare = useCallback(async (source: string, platform?: string) => {
    if (!profile?.referral?.referralCode) return;
    
    try {
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.referralsTrack}`;
      await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          referralCode: profile.referral.referralCode,
          trackingData: {
            source,
            utmSource: platform || source,
            utmMedium: 'social',
            utmCampaign: 'referral_share'
          }
        }),
      }));
    } catch (error) {
      // Silently fail tracking - don't disrupt user experience
      logger.error('Failed to track referral share', error instanceof Error ? error : new Error(String(error)));
    }
  }, [profile?.referral?.referralCode]);

  // Social sharing handlers
  const handleShare = useCallback((platform: string) => {
    if (!referralLink) return;
    
    const shareText = `Join me on LocalPro! Use my referral code ${profile?.referral?.referralCode} to get started and earn rewards. ${referralLink}`;
    const shareUrl = encodeURIComponent(referralLink);
    const shareTextEncoded = encodeURIComponent(shareText);
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${shareTextEncoded}&url=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${shareTextEncoded}`,
      email: `mailto:?subject=Join me on LocalPro&body=${shareTextEncoded}`
    };

    const shareUrl_full = shareUrls[platform.toLowerCase()];
    if (shareUrl_full) {
      trackReferralShare('social_media', platform);
      window.open(shareUrl_full, '_blank', 'width=600,height=400');
    }
  }, [referralLink, profile?.referral?.referralCode, trackReferralShare]);

  // Copy referral link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      trackReferralShare('direct_link');
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      logger.error('Failed to copy link', error instanceof Error ? error : new Error(String(error)));
      alert('Failed to copy link. Please try again.');
    }
  }, [referralLink, trackReferralShare]);

  // Copy referral code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!profile?.referral?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(profile.referral.referralCode);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      logger.error('Failed to copy code', error instanceof Error ? error : new Error(String(error)));
      alert('Failed to copy code. Please try again.');
    }
  }, [profile?.referral?.referralCode]);

  if (!profile?.referral?.referralCode) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Gift className="w-4 h-4" />
        Referral Program
      </h3>
      
      {/* How It Works Section */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-primary mb-1">How It Works</h4>
            <p className="text-xs text-primary leading-relaxed">
              Share your unique referral code with friends and family. When they sign up using your code, you both earn rewards! 
              Track your referrals and see your tier improve as you refer more people. 
              Tiers: Bronze (0-4), Silver (5-19), Gold (20-49), Platinum (50+).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Referral Code */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono font-semibold text-gray-700 bg-gray-50 p-2 rounded flex-1">
              {profile.referral.referralCode}
            </p>
            <button
              onClick={handleCopyCode}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title={copied === 'code' ? 'Copied!' : 'Copy referral code'}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Referral Link */}
        {referralLink && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Your Referral Link</label>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded flex-1 truncate">
                {referralLink}
              </p>
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title={copied === 'link' ? 'Copied!' : 'Copy referral link'}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Social Sharing */}
        <div>
          <label className="block text-xs text-gray-600 mb-2">Share via Social Media</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleShare('facebook')}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-xs">Facebook</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share on Twitter/X"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-[#0077B5] text-white rounded-lg hover:bg-[#006399] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-xs">LinkedIn</span>
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20ba5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('email')}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
              <span className="text-xs">Email</span>
            </button>
            <button
              onClick={handleCopyLink}
              disabled={!referralLink}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy Link"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs">Copy Link</span>
            </button>
          </div>
        </div>

        {/* Referral Stats */}
        {profile.referral.referralStats && (
          <div className="space-y-2 pt-3 border-t border-gray-200">
            {profile.referral.referralStats.referralTier && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tier</span>
                <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    profile.referral.referralStats.referralTier === 'platinum' ? 'bg-purple-500' :
                    profile.referral.referralStats.referralTier === 'gold' ? 'bg-yellow-500' :
                    profile.referral.referralStats.referralTier === 'silver' ? 'bg-gray-400' :
                    'bg-orange-500'
                  }`}></span>
                  {profile.referral.referralStats.referralTier}
                </span>
              </div>
            )}
            {profile.referral.referralStats.totalReferrals !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Referrals</span>
                <span className="text-sm font-medium text-gray-700">
                  {profile.referral.referralStats.totalReferrals}
                </span>
              </div>
            )}
            {profile.referral.referralStats.successfulReferrals !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successful</span>
                <span className="text-sm font-medium text-gray-700">
                  {profile.referral.referralStats.successfulReferrals}
                </span>
              </div>
            )}
            {profile.referral.referralStats.totalRewardsEarned !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rewards Earned</span>
                <span className="text-sm font-medium text-accent">
                  {profile.referral.referralStats.totalRewardsEarned}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

