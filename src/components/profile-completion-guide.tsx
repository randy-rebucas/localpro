"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  User,
  Mail,
  MapPin,
  FileText,
  Image as ImageIcon,
  Award,
  Shield,
  Briefcase,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { UserProfileData } from "@/components/user-profile";

interface ProfileCompletionGuideProps {
  profile: UserProfileData | null;
  hasProviderRole?: boolean;
  providerOnboardingCompleted?: boolean;
}

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  field: string;
  priority: "high" | "medium" | "low";
  category: "basic" | "profile" | "verification" | "provider";
  checkComplete: (profile: UserProfileData) => boolean;
  getActionUrl: () => string;
}

export function ProfileCompletionGuide({ 
  profile, 
  hasProviderRole = false,
  providerOnboardingCompleted = false 
}: ProfileCompletionGuideProps) {
  const steps: Step[] = useMemo(() => {
    const baseSteps: Step[] = [
      {
        id: "name",
        title: "Add Your Name",
        description: "Enter your first and last name to personalize your profile",
        icon: User,
        field: "name",
        priority: "high",
        category: "basic",
        checkComplete: (p) => !!(p.firstName && p.lastName) || !!p.name,
        getActionUrl: () => "/profile/edit#name",
      },
      {
        id: "email",
        title: "Add Email Address",
        description: "Add your email to receive important notifications and updates",
        icon: Mail,
        field: "email",
        priority: "high",
        category: "basic",
        checkComplete: (p) => !!p.email,
        getActionUrl: () => "/profile/edit#email",
      },
      {
        id: "location",
        title: "Add Your Location",
        description: "Share your location to help clients find you nearby",
        icon: MapPin,
        field: "address",
        priority: "high",
        category: "basic",
        checkComplete: (p) => {
          const address = p.profile?.address;
          return !!(address?.city || address?.state || p.location);
        },
        getActionUrl: () => "/profile/edit#location",
      },
      {
        id: "avatar",
        title: "Upload Profile Photo",
        description: "Add a professional photo - profiles with photos get 7x more views",
        icon: ImageIcon,
        field: "avatar",
        priority: "high",
        category: "profile",
        checkComplete: (p) => {
          const avatar = p.profile?.avatar;
          return !!(avatar?.url || avatar?.thumbnail);
        },
        getActionUrl: () => "/profile/edit#avatar",
      },
      {
        id: "bio",
        title: "Write Your Bio",
        description: "Tell clients about yourself - a compelling bio increases profile views by 40%",
        icon: FileText,
        field: "bio",
        priority: "high",
        category: "profile",
        checkComplete: (p) => !!p.profile?.bio,
        getActionUrl: () => "/profile/edit#bio",
      },
      {
        id: "skills",
        title: "Add Your Skills",
        description: "List your professional skills - profiles with 5+ skills get 60% more opportunities",
        icon: Award,
        field: "skills",
        priority: "medium",
        category: "profile",
        checkComplete: (p) => {
          const skills = p.profile?.skills;
          return Array.isArray(skills) && skills.length >= 3;
        },
        getActionUrl: () => "/profile/edit#skills",
      },
      {
        id: "portfolio",
        title: "Add Portfolio Images",
        description: "Upload 3-5 high-quality images showcasing your best work",
        icon: ImageIcon,
        field: "portfolio",
        priority: "medium",
        category: "profile",
        checkComplete: (p) => {
          const portfolio = p.profile?.portfolio;
          return Array.isArray(portfolio) && portfolio.length > 0;
        },
        getActionUrl: () => "/profile/edit#portfolio",
      },
    ];

    // Add provider-specific steps if user has provider role
    if (hasProviderRole) {
      baseSteps.push(
        {
          id: "provider-onboarding",
          title: "Complete Provider Onboarding",
          description: "Finish your provider profile setup to start accepting jobs",
          icon: Briefcase,
          field: "provider-onboarding",
          priority: "high",
          category: "provider",
          checkComplete: () => providerOnboardingCompleted,
          getActionUrl: () => "/profile?tab=provider",
        },
        {
          id: "verification",
          title: "Complete Verification",
          description: "Verify your identity and complete background checks",
          icon: Shield,
          field: "verification",
          priority: "high",
          category: "verification",
          checkComplete: (p) => !!p.isVerified || !!p.verification?.isVerified,
          getActionUrl: () => "/profile/edit#verification",
        }
      );
    }

    return baseSteps;
  }, [hasProviderRole]);

  const completedSteps = useMemo(() => {
    if (!profile) return [];
    return steps.filter((step) => step.checkComplete(profile));
  }, [profile, steps]);

  const incompleteSteps = useMemo(() => {
    if (!profile) return steps;
    return steps.filter((step) => !step.checkComplete(profile));
  }, [profile, steps]);

  const completionPercentage = useMemo(() => {
    if (steps.length === 0) return 100;
    return Math.round((completedSteps.length / steps.length) * 100);
  }, [completedSteps.length, steps.length]);

  const highPriorityIncomplete = incompleteSteps.filter((s) => s.priority === "high");
  const nextStep = highPriorityIncomplete[0] || incompleteSteps[0];

  if (!profile) {
    return null;
  }

  // Don't show if profile is 100% complete
  if (completionPercentage === 100) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Complete! 🎉</h3>
          <p className="text-gray-600 mb-4">Your profile is fully set up and ready to go.</p>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all"
          >
            Update Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-white p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
              <p className="text-sm text-gray-600 mt-1">
                Follow these steps to unlock more opportunities and increase your visibility
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent">{completionPercentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent to-accent/80 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Next Step Highlight */}
      {nextStep && (
        <div className="p-6 bg-gradient-to-r from-accent/5 to-accent/10 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">Next Step</span>
                {nextStep.priority === "high" && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                    High Priority
                  </span>
                )}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">{nextStep.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{nextStep.description}</p>
              <Link
                href={nextStep.getActionUrl()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-md hover:shadow-lg"
              >
                Complete This Step
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = step.checkComplete(profile);
            const Icon = step.icon;
            const stepNumber = index + 1;

            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                  isCompleted
                    ? "bg-green-50/50 border-green-200"
                    : step.id === nextStep?.id
                    ? "bg-accent/5 border-accent shadow-md"
                    : "bg-gray-50/50 border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Step Number/Status */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        step.id === nextStep?.id
                          ? "bg-accent text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {stepNumber}
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isCompleted ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                      <h5
                        className={`font-semibold ${
                          isCompleted ? "text-gray-700 line-through" : "text-gray-900"
                        }`}
                      >
                        {step.title}
                      </h5>
                    </div>
                    {step.priority === "high" && !isCompleted && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium flex-shrink-0">
                        Required
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isCompleted ? "text-gray-500" : "text-gray-600"} mb-2`}>
                    {step.description}
                  </p>
                  {!isCompleted && (
                    <Link
                      href={step.getActionUrl()}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors group"
                    >
                      Complete this step
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-5 top-14 w-0.5 h-8 ${
                      isCompleted ? "bg-green-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h4 className="font-semibold text-gray-900">Benefits of Completing Your Profile</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-accent mb-1">
              {completionPercentage >= 80 ? "7x" : completionPercentage >= 60 ? "3x" : "2x"}
            </div>
            <div className="text-sm text-gray-600">More Profile Views</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-accent mb-1">
              {completionPercentage >= 80 ? "85%" : completionPercentage >= 60 ? "60%" : "45%"}
            </div>
            <div className="text-sm text-gray-600">More Opportunities</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-accent mb-1">
              {completionPercentage >= 80 ? "5x" : completionPercentage >= 60 ? "3x" : "2x"}
            </div>
            <div className="text-sm text-gray-600">Higher Trust Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
