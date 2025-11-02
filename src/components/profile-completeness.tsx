"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle, Lightbulb, TrendingUp, Loader2, AlertCircle, User, Shield, FileText, Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface CategoryCompleteness {
  completed: boolean;
  missing: string[];
  percentage: number;
}

interface ProfileCompletenessResponse {
  completeness: {
    basic: CategoryCompleteness;
    profile: CategoryCompleteness;
    verification: CategoryCompleteness;
    overall: {
      completed: boolean;
      percentage: number;
      missingFields: string[];
      nextSteps: string[];
    };
  };
  canAccessDashboard: boolean;
  needsOnboarding: boolean;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
}

interface ProfileCompletenessProps {
  profileData?: Record<string, unknown>;
  onSuggestionClick?: (field: string) => void;
}

export function ProfileCompleteness({ profileData, onSuggestionClick }: ProfileCompletenessProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [apiData, setApiData] = useState<ProfileCompletenessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile completeness from API
  useEffect(() => {
    const fetchProfileCompleteness = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!getApiToken()) {
          throw new Error('Not authenticated');
        }
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.authProfileCompleteness}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        
        if (response.ok) {
          const responseData = await response.json();
          const data = responseData?.data || responseData;
          
          // Use the API response structure directly
          if (data && data.completeness) {
            setApiData(data as ProfileCompletenessResponse);
          }
        } else {
          throw new Error(`Failed to fetch profile completeness: ${response.status}`);
        }
      } catch (err) {
        logger.error('Error fetching profile completeness', err instanceof Error ? err : new Error(String(err)));
        setError('Failed to load profile completeness');
        // Will fall back to client-side calculation
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileCompleteness();
  }, []);

  // Extract overall score from API data
  const overallScore = useMemo(() => {
    if (apiData?.completeness?.overall) {
      return {
        percentage: apiData.completeness.overall.percentage,
        completed: apiData.completeness.overall.completed,
        missing: apiData.completeness.overall.missingFields || [],
        nextSteps: apiData.completeness.overall.nextSteps || []
      };
    }
    return null;
  }, [apiData]);

  // Use API data if available, otherwise fall back to client-side calculation
  const completenessScore = useMemo(() => {
    if (overallScore) {
      // Calculate approximate completed/total from percentage
      const total = 100;
      const completed = Math.round((overallScore.percentage / 100) * total);
      return {
        percentage: overallScore.percentage,
        completed,
        total,
        missing: overallScore.missing
      };
    }
    // Fallback to client-side calculation
    if (!profileData) {
      return {
        percentage: 0,
        completed: 0,
        total: 0,
        missing: []
      };
    }

    const fields = [
      'firstName', 'lastName', 'email', 'name', 'phone', 'bio', 'location', 'website', 
      'skills', 'experience', 'avatar', 'portfolio'
    ];
    
    const completedFields = fields.filter(field => {
      const profile = profileData as Record<string, unknown>;
      if (field === 'skills') {
        const skills = profile?.profile?.skills || profile?.skills;
        return Array.isArray(skills) && skills.length > 0;
      }
      if (field === 'portfolio') {
        const portfolio = profile?.profile?.portfolio || profile?.portfolio;
        return Array.isArray(portfolio) && portfolio.length > 0;
      }
      if (field === 'avatar') {
        const avatar = profile?.profile?.avatar || profile?.avatar;
        return avatar && (avatar.url || avatar.thumbnail);
      }
      if (field === 'bio') {
        return profile?.profile?.bio || profile?.bio;
      }
      if (field === 'location') {
        const address = profile?.profile?.address || profile?.address;
        return address && (address.city || address.location);
      }
      return profile?.[field] || profile?.profile?.[field];
    });
    
    return {
      percentage: Math.round((completedFields.length / fields.length) * 100),
      completed: completedFields.length,
      total: fields.length,
      missing: fields.filter(field => !completedFields.includes(field))
    };
  }, [profileData, overallScore]);

  interface Recommendation {
    id?: string;
    field?: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
  }

  // Get recommendations from API nextSteps or generate client-side
  const getRecommendations = (): Recommendation[] => {
    // Use API nextSteps if available
    if (overallScore && overallScore.nextSteps.length > 0) {
      return overallScore.nextSteps.map((step, index) => ({
        id: `next-step-${index}`,
        title: step,
        description: step,
        priority: 'high' as const,
        suggestion: step
      }));
    }

    // Fallback to client-side recommendations
    const recommendations: Recommendation[] = [];

    if (!profileData?.firstName) {
      recommendations.push({
        field: 'firstName',
        title: 'Add your first name',
        description: 'Your first name helps clients identify you',
        priority: 'high',
        suggestion: 'Enter your first name to personalize your profile.'
      });
    }

    if (!profileData?.lastName) {
      recommendations.push({
        field: 'lastName',
        title: 'Add your last name',
        description: 'Your last name completes your identity',
        priority: 'high',
        suggestion: 'Enter your last name to complete your profile.'
      });
    }

    if (!profileData?.email) {
      recommendations.push({
        field: 'email',
        title: 'Add your email address',
        description: 'Email helps with important notifications',
        priority: 'medium',
        suggestion: 'Add your email to receive important updates and notifications.'
      });
    }

    if (!profileData?.bio) {
      recommendations.push({
        field: 'bio',
        title: 'Add a compelling bio',
        description: 'A well-written bio increases profile views by 40%',
        priority: 'high',
        suggestion: 'Write 2-3 sentences about your professional background and what makes you unique.'
      });
    }

    if (!profileData?.skills || !Array.isArray(profileData.skills) || profileData.skills.length < 3) {
      recommendations.push({
        field: 'skills',
        title: 'Add more skills',
        description: 'Profiles with 5+ skills get 60% more opportunities',
        priority: 'high',
        suggestion: 'Add at least 5 relevant skills to showcase your expertise.'
      });
    }

    if (!profileData?.portfolio || !Array.isArray(profileData.portfolio) || profileData.portfolio.length === 0) {
      recommendations.push({
        field: 'portfolio',
        title: 'Upload portfolio images',
        description: 'Visual portfolios increase engagement by 80%',
        priority: 'medium',
        suggestion: 'Upload 3-5 high-quality images showcasing your best work.'
      });
    }

    if (!profileData?.avatar) {
      recommendations.push({
        field: 'avatar',
        title: 'Add a professional photo',
        description: 'Profiles with photos get 7x more views',
        priority: 'high',
        suggestion: 'Upload a clear, professional headshot.'
      });
    }

    if (!profileData?.experience) {
      recommendations.push({
        field: 'experience',
        title: 'Describe your experience',
        description: 'Detailed experience helps clients understand your background',
        priority: 'medium',
        suggestion: 'Write about your professional journey and key achievements.'
      });
    }

    return recommendations;
  };

  const score = completenessScore;
  const recommendations = getRecommendations();

  // Category icons and colors
  const categoryConfig = {
    basic: { 
      icon: User, 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200', 
      textColor: 'text-blue-700',
      progressColor: 'bg-blue-600'
    },
    profile: { 
      icon: FileText, 
      bgColor: 'bg-purple-50', 
      borderColor: 'border-purple-200', 
      textColor: 'text-purple-700',
      progressColor: 'bg-purple-600'
    },
    verification: { 
      icon: Shield, 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200', 
      textColor: 'text-green-700',
      progressColor: 'bg-green-600'
    }
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Profile Completeness</h3>
          {apiData?.needsOnboarding === false && apiData?.canAccessDashboard && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Dashboard Access Enabled
            </p>
          )}
        </div>
        {overallScore && !overallScore.completed && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-700 transition-colors"
            disabled={loading}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{showSuggestions ? 'Hide' : 'Show'} Next Steps</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Loading profile completeness...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && !apiData && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">{error}. Using client-side calculation.</span>
        </div>
      )}

      {/* Overall Score Display */}
      {!loading && score && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-700">{score.percentage}%</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Overall Complete</span>
                {overallScore?.completed && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 rounded-full">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {score.percentage >= 80 ? "Excellent!" : 
                 score.percentage >= 60 ? "Good Progress" : "Keep Going"}
              </span>
            </div>
          </div>
        
          <div className="w-full bg-gray-100 rounded-full h-4 mb-3 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-700 ${getScoreBgColor(score.percentage)} shadow-sm`}
              style={{ width: `${score.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {!loading && apiData?.completeness && (
        <div className="mb-6">
          <button
            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
            className="w-full flex items-center justify-between mb-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span>Category Breakdown</span>
            {showCategoryBreakdown ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showCategoryBreakdown && (
            <div className="space-y-3">
              {(['basic', 'profile', 'verification'] as const).map((category) => {
                const categoryData = apiData.completeness[category];
                if (!categoryData) return null;
                
                const config = categoryConfig[category];
                const Icon = config.icon;
                const isComplete = categoryData.completed;
                
                return (
                  <div
                    key={category}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isComplete 
                        ? `${config.bgColor} ${config.borderColor}` 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          isComplete ? `${config.bgColor} ${config.textColor}` : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 capitalize">
                            {category === 'basic' ? 'Basic Information' :
                             category === 'profile' ? 'Profile Details' :
                             'Verification'}
                          </h5>
                          {categoryData.missing.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {categoryData.missing.length} field{categoryData.missing.length !== 1 ? 's' : ''} missing
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isComplete ? config.textColor : 'text-gray-500'
                        }`}>
                          {categoryData.percentage}%
                        </span>
                        {isComplete && (
                          <CheckCircle className={`w-5 h-5 ${config.textColor}`} />
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isComplete ? config.progressColor : 'bg-gray-400'
                        }`}
                        style={{ width: `${categoryData.percentage}%` }}
                      ></div>
                    </div>
                    
                    {categoryData.missing.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {categoryData.missing.slice(0, 3).map((field, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white rounded border border-gray-200 text-gray-600">
                            {field}
                          </span>
                        ))}
                        {categoryData.missing.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200 text-gray-500">
                            +{categoryData.missing.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Next Steps / Recommendations */}
      {!loading && showSuggestions && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-700">Next Steps to Complete Your Profile</h4>
          </div>
          
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={rec.id || index}
                  className="group rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
                  onClick={() => onSuggestionClick?.(rec.field || rec.title)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        rec.priority === 'high' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-700 mb-1 group-hover:text-green-700 transition-colors">
                          {rec.title}
                        </h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {rec.description || rec.suggestion}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSuggestionClick?.(rec.field || rec.title);
                      }}
                      className="ml-4 p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Complete this step"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-green-700 mb-1">Profile Complete!</p>
              <p className="text-sm text-gray-600">Your profile is fully set up. Great job!</p>
            </div>
          )}
        </div>
      )}

      {/* Impact Stats - Only show if profile is not complete */}
      {!loading && score && !overallScore?.completed && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3 text-center">Complete your profile to unlock:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-xl font-bold text-blue-700 mb-1">
                {score.percentage >= 80 ? "7x" : score.percentage >= 60 ? "3x" : "2x"}
              </div>
              <div className="text-xs text-gray-600">More Profile Views</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="text-xl font-bold text-green-700 mb-1">
                {score.percentage >= 80 ? "85%" : score.percentage >= 60 ? "60%" : "45%"}
              </div>
              <div className="text-xs text-gray-600">More Opportunities</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
