"use client";

import { useState } from "react";
import { CheckCircle, Lightbulb, TrendingUp, Target } from "lucide-react";

interface ProfileCompletenessProps {
  profileData: Record<string, unknown>;
  onSuggestionClick: (field: string) => void;
}

export function ProfileCompleteness({ profileData, onSuggestionClick }: ProfileCompletenessProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getCompletenessScore = () => {
    const fields = [
      'name', 'phone', 'bio', 'location', 'website', 
      'skills', 'experience', 'avatar', 'portfolio'
    ];
    
    const completedFields = fields.filter(field => {
      if (field === 'skills') return Array.isArray(profileData?.skills) && profileData.skills.length > 0;    
      if (field === 'portfolio') return Array.isArray(profileData?.portfolio) && profileData.portfolio.length > 0;                                                                              
      return profileData?.[field] && profileData[field] !== "";
    });
    
    return {
      percentage: Math.round((completedFields.length / fields.length) * 100),
      completed: completedFields.length,
      total: fields.length,
      missing: fields.filter(field => !completedFields.includes(field))
    };
  };

  const getAIRecommendations = () => {
    const recommendations = [];

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

  const score = getCompletenessScore();
  const recommendations = getAIRecommendations();

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Profile Completeness</h3>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-700"
        >
          <Lightbulb className="w-4 h-4" />
          <span>AI Suggestions</span>
        </button>
      </div>

      {/* Score Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-700">{score.percentage}%</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">
              {score.completed}/{score.total} fields
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(score.percentage)}`}
            style={{ width: `${score.percentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Complete your profile</span>
          <span className={`font-medium ${getScoreColor(score.percentage)}`}>
            {score.percentage >= 80 ? "Excellent!" : 
             score.percentage >= 60 ? "Good progress" : "Needs improvement"}
          </span>
        </div>
      </div>

      {/* AI Recommendations */}
      {showSuggestions && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-700">AI-Powered Recommendations</h4>
          </div>
          
          {recommendations.map((rec, index) => (
            <div key={index} className="rounded-lg p-4 hover:bg-green-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <h5 className="font-medium text-gray-700">{rec.title}</h5>
                </div>
                <button
                  onClick={() => onSuggestionClick(rec.field)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Add Now
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                💡 {rec.suggestion}
              </p>
            </div>
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Your profile is complete! Great job!</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-700">
              {score.percentage >= 80 ? "7x" : score.percentage >= 60 ? "3x" : "1x"}
            </div>
            <div className="text-gray-600">More views</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-700">
              {score.percentage >= 80 ? "85%" : score.percentage >= 60 ? "60%" : "30%"}
            </div>
            <div className="text-gray-600">More opportunities</div>
          </div>
        </div>
      </div>
    </div>
  );
}
