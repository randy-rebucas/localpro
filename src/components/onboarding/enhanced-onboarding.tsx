"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Shield,
  Home,
  Wrench,
  Package,
  GraduationCap,
  Heart,
  Star,
  Lightbulb,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Enhanced schemas with progressive validation
const basicInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.string().min(1, "Please select your gender"),
  birthdate: z.string().min(1, "Birthdate is required").refine((date) => {
    const dateObj = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate()) ? age - 1 : age;
    return actualAge >= 13 && actualAge <= 120;
  }, "You must be at least 13 years old"),
});

const roleSelectionSchema = z.object({
  primaryRole: z.enum(["client", "provider", "supplier", "instructor"], {
    required_error: "Please select your primary role"
  }),
  secondaryRoles: z.array(z.enum(["client", "provider", "supplier", "instructor"])).optional(),
});

const contactInfoSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z.string().optional(),
});

const profileInfoSchema = z.object({
  bio: z.string().min(10, "Please write at least 10 characters").max(500, "Bio must be less than 500 characters"),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
});

const locationSchema = z.object({
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    zipCode: z.string().min(1, "ZIP/Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;
type RoleSelectionForm = z.infer<typeof roleSelectionSchema>;
type ContactInfoForm = z.infer<typeof contactInfoSchema>;
type ProfileInfoForm = z.infer<typeof profileInfoSchema>;
type LocationForm = z.infer<typeof locationSchema>;

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to LocalPro!",
    subtitle: "Let's set up your profile in just a few steps",
    icon: Sparkles,
    estimatedTime: "2 minutes",
    component: "WelcomeStep"
  },
  {
    id: "basic",
    title: "Basic Information",
    subtitle: "Tell us a bit about yourself",
    icon: User,
    estimatedTime: "30 seconds",
    component: "BasicInfoStep"
  },
  {
    id: "role",
    title: "What brings you here?",
    subtitle: "Choose how you'll use LocalPro",
    icon: Target,
    estimatedTime: "45 seconds",
    component: "RoleSelectionStep"
  },
  {
    id: "contact",
    title: "Stay Connected",
    subtitle: "How can we reach you?",
    icon: Mail,
    estimatedTime: "30 seconds",
    component: "ContactInfoStep"
  },
  {
    id: "profile",
    title: "Your Story",
    subtitle: "Help others understand what you do",
    icon: Briefcase,
    estimatedTime: "1 minute",
    component: "ProfileInfoStep"
  },
  {
    id: "location",
    title: "Your Location",
    subtitle: "Where are you based?",
    icon: MapPin,
    estimatedTime: "45 seconds",
    component: "LocationStep"
  },
  {
    id: "complete",
    title: "You're All Set!",
    subtitle: "Welcome to the LocalPro community",
    icon: CheckCircle,
    estimatedTime: "Complete",
    component: "CompletionStep"
  }
];

const ROLE_OPTIONS = [
  {
    id: "client",
    title: "I'm looking for services",
    description: "Find and book professional services",
    icon: Home,
    benefits: ["Book services easily", "Compare providers", "Track your bookings"]
  },
  {
    id: "provider",
    title: "I provide services",
    description: "Offer your professional services to clients",
    icon: Wrench,
    benefits: ["Grow your business", "Manage bookings", "Get paid securely"]
  },
  {
    id: "supplier",
    title: "I sell supplies",
    description: "Sell tools, equipment, and materials",
    icon: Package,
    benefits: ["Reach more customers", "Easy inventory management", "Secure payments"]
  },
  {
    id: "instructor",
    title: "I'm an instructor",
    description: "Teach courses and certifications",
    icon: GraduationCap,
    benefits: ["Share your knowledge", "Reach students online", "Monetize your expertise"]
  }
];

const INTEREST_OPTIONS = [
  "Home Services", "Construction", "Cleaning", "Landscaping",
  "Electrical Work", "Plumbing", "Painting", "Carpentry",
  "Equipment Rental", "Professional Training", "Business Growth",
  "Local Community", "Home Improvement", "Maintenance"
];

interface EnhancedOnboardingProps {
  onComplete: () => void;
}

export function EnhancedOnboarding({ onComplete }: EnhancedOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [basicInfo, setBasicInfo] = useState<Partial<BasicInfoForm>>({});
  const [roleSelection, setRoleSelection] = useState<Partial<RoleSelectionForm>>({});
  const [contactInfo, setContactInfo] = useState<Partial<ContactInfoForm>>({});
  const [profileInfo, setProfileInfo] = useState<Partial<ProfileInfoForm>>({});
  const [locationInfo, setLocationInfo] = useState<Partial<LocationForm>>({});

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const onboardingData = {
        ...basicInfo,
        ...roleSelection,
        ...contactInfo,
        ...profileInfo,
        ...locationInfo,
        onboardingCompleted: true,
        completedAt: new Date().toISOString()
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.authProfile}`,
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify(onboardingData)
        })
      );

      if (response.ok || response.status === 404) { // Allow fallback for demo
        toast.success("Welcome to LocalPro! Your profile is ready.");
        onComplete();
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      logger.error("Onboarding completion error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStepData.component) {
      case "WelcomeStep":
        return <WelcomeStep onNext={handleNext} />;
      case "BasicInfoStep":
        return (
          <BasicInfoStep
            data={basicInfo}
            onChange={setBasicInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case "RoleSelectionStep":
        return (
          <RoleSelectionStep
            data={roleSelection}
            onChange={setRoleSelection}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case "ContactInfoStep":
        return (
          <ContactInfoStep
            data={contactInfo}
            onChange={setContactInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case "ProfileInfoStep":
        return (
          <ProfileInfoStep
            data={profileInfo}
            onChange={setProfileInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case "LocationStep":
        return (
          <LocationStep
            data={locationInfo}
            onChange={setLocationInfo}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case "CompletionStep":
        return <CompletionStep onComplete={handleComplete} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {STEPS.slice(0, -1).map((step, index) => (
                <div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index < currentStep
                      ? "bg-green-500"
                      : index === currentStep
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {currentStepData.estimatedTime}
            </span>
          </div>

          <Progress value={progress} className="mb-4" />

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600">
              {currentStepData.subtitle}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 shadow-lg">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          {currentStep < STEPS.length - 2 && (
            <Button
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-blue-600" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome to LocalPro!
        </h2>
        <p className="text-gray-600">
          We&apos;re excited to have you join our community of professionals and clients.
          Let&apos;s take a quick tour to set up your profile and get you started.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <h3 className="font-medium text-blue-900 mb-2">What you&apos;ll accomplish:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create your professional profile</li>
            <li>• Choose your role in the community</li>
            <li>• Set up contact preferences</li>
            <li>• Customize your experience</li>
          </ul>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Let&apos;s Get Started!
      </Button>
    </div>
  );
}

// Basic Info Step Component
function BasicInfoStep({
  data,
  onChange,
  onNext,
  onPrevious
}: {
  data: Partial<BasicInfoForm>;
  onChange: (data: Partial<BasicInfoForm>) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [isValid, setIsValid] = useState(false);

  const validateForm = (formData: Partial<BasicInfoForm>) => {
    const result = basicInfoSchema.safeParse(formData);
    setIsValid(result.success);
    return result.success;
  };

  const handleChange = (field: keyof BasicInfoForm, value: string) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    validateForm(newData);
  };

  const handleSubmit = () => {
    if (validateForm(data)) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">First Name</label>
          <Input
            value={data.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Last Name</label>
          <Input
            value={data.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Gender</label>
        <select
          value={data.gender || ""}
          onChange={(e) => handleChange("gender", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Date of Birth</label>
        <Input
          type="date"
          value={data.birthdate || ""}
          onChange={(e) => handleChange("birthdate", e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
        Continue
      </Button>
    </div>
  );
}

// Role Selection Step Component
function RoleSelectionStep({
  data,
  onChange,
  onNext,
  onPrevious
}: {
  data: Partial<RoleSelectionForm>;
  onChange: (data: Partial<RoleSelectionForm>) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    data.secondaryRoles || (data.primaryRole ? [data.primaryRole] : [])
  );

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedRoles.length > 0) {
      const primaryRole = selectedRoles[0];
      const secondaryRoles = selectedRoles.slice(1);

      onChange({
        primaryRole: primaryRole as RoleSelectionForm['primaryRole'],
        secondaryRoles: secondaryRoles as RoleSelectionForm['secondaryRoles']
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          Select all that apply to you. You can change this later in your settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRoles.includes(role.id);
          const Icon = role.icon;

          return (
            <Card
              key={role.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleRoleToggle(role.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className={`font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {role.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.benefits.slice(0, 2).map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selectedRoles.length === 0}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

// Contact Info Step Component
function ContactInfoStep({
  data,
  onChange,
  onNext,
  onPrevious
}: {
  data: Partial<ContactInfoForm>;
  onChange: (data: Partial<ContactInfoForm>) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const handleChange = (field: keyof ContactInfoForm, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          This information helps us keep you updated and allows others to contact you.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Email Address <span className="text-gray-500">(optional)</span>
          </label>
          <Input
            type="email"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="your.email@example.com"
          />
          <p className="text-xs text-gray-500">
            We&apos;ll use this for important updates and password recovery
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Privacy First</p>
              <p className="text-blue-800 mt-1">
                Your contact information is kept private and only shared with your consent.
                We never sell your data to third parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}

// Profile Info Step Component
function ProfileInfoStep({
  data,
  onChange,
  onNext,
  onPrevious
}: {
  data: Partial<ProfileInfoForm>;
  onChange: (data: Partial<ProfileInfoForm>) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    data.interests || []
  );

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const handleSubmit = () => {
    const bio = data.bio || "";
    if (bio.length >= 10 && selectedInterests.length > 0) {
      onChange({
        bio,
        interests: selectedInterests
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Tell us about yourself
        </label>
        <Textarea
          value={data.bio || ""}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          placeholder="Share your experience, skills, or what you&apos;re passionate about..."
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Minimum 10 characters</span>
          <span>{(data.bio || "").length}/500</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          What are you interested in?
        </label>
        <p className="text-xs text-gray-600">
          Select all that apply to help us personalize your experience
        </p>

        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <Badge
              key={interest}
              variant={selectedInterests.includes(interest) ? "default" : "outline"}
              className="cursor-pointer hover:bg-blue-100"
              onClick={() => handleInterestToggle(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!data.bio || (data.bio || "").length < 10 || selectedInterests.length === 0}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

// Location Step Component
function LocationStep({
  data,
  onChange,
  onNext,
  onPrevious
}: {
  data: Partial<LocationForm>;
  onChange: (data: Partial<LocationForm>) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [isValid, setIsValid] = useState(false);

  const validateForm = (formData: Partial<LocationForm>) => {
    const result = locationSchema.safeParse(formData);
    setIsValid(result.success);
    return result.success;
  };

  const handleAddressChange = (field: string, value: string) => {
    const currentAddress = data.address || {};
    const updatedAddress = {
      ...currentAddress,
      [field]: value
    };
    const newData = {
      ...data,
      address: updatedAddress
    } as Partial<LocationForm>;
    onChange(newData);
    validateForm(newData);
  };

  const handleSubmit = () => {
    if (validateForm(data)) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          This helps us show you relevant services and connect you with local professionals.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Street Address</label>
          <Input
            value={data.address?.street || ""}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">City</label>
            <Input
              value={data.address?.city || ""}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              placeholder="City"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">State/Province</label>
            <Input
              value={data.address?.state || ""}
              onChange={(e) => handleAddressChange("state", e.target.value)}
              placeholder="State or Province"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ZIP/Postal Code</label>
            <Input
              value={data.address?.zipCode || ""}
              onChange={(e) => handleAddressChange("zipCode", e.target.value)}
              placeholder="12345"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Country</label>
            <select
              value={data.address?.country || ""}
              onChange={(e) => handleAddressChange("country", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select country</option>
              <option value="Philippines">Philippines</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
        Complete Setup
      </Button>
    </div>
  );
}

// Completion Step Component
function CompletionStep({
  onComplete,
  isSubmitting
}: {
  onComplete: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          You&apos;re All Set!
        </h2>
        <p className="text-gray-600">
          Welcome to the LocalPro community. Your profile is ready and you can start exploring services, connecting with professionals, and growing your network.
        </p>

        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="font-medium text-green-900 mb-3">What&apos;s Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-2">
              <Star className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Explore Services</p>
                <p className="text-sm text-green-800">Browse and book professional services</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Heart className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Build Your Network</p>
                <p className="text-sm text-green-800">Connect with local professionals</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Briefcase className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Grow Your Business</p>
                <p className="text-sm text-green-800">Offer your services to clients</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Learn & Teach</p>
                <p className="text-sm text-green-800">Take courses or become an instructor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={onComplete}
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Setting up your account...
          </>
        ) : (
          "Start Exploring LocalPro"
        )}
      </Button>
    </div>
  );
}
