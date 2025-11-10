"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { useSession } from "@/hooks/useAuth";

// Schema for basic onboarding information
const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  wantsToBeProvider: z.boolean().optional(),
  wantsToBeSupplier: z.boolean().optional(),
  wantsToBeInstructor: z.boolean().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const steps = [
  {
    id: 1,
    title: "Welcome!",
    description: "Let's get to know you",
    icon: User,
    fields: ["firstName", "lastName"],
  },
  {
    id: 2,
    title: "Your Roles",
    description: "What will you be doing on LocalPro?",
    icon: Shield,
    fields: ["wantsToBeProvider", "wantsToBeSupplier", "wantsToBeInstructor"],
  },
  {
    id: 3,
    title: "Contact Info",
    description: "How can we reach you?",
    icon: Mail,
    fields: ["email"],
  },
  {
    id: 4,
    title: "Tell Us About Yourself",
    description: "Help others get to know you",
    icon: Briefcase,
    fields: ["bio"],
  },
  {
    id: 5,
    title: "Location",
    description: "Where are you based?",
    icon: MapPin,
    fields: ["address"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  });

  // Pre-fill form with session data if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.firstName) setValue("firstName", session.user.firstName);
      if (session.user.lastName) setValue("lastName", session.user.lastName);
      if (session.user.email) setValue("email", session.user.email);
      // Pre-select roles if user has roles
      if (session.user.roles && session.user.roles.length > 0) {
        setValue("wantsToBeProvider", session.user.roles.includes("provider"));
        setValue("wantsToBeSupplier", session.user.roles.includes("supplier"));
        setValue("wantsToBeInstructor", session.user.roles.includes("instructor"));
      }
    }
  }, [session, setValue]);

  // Check if user is already authenticated
  useEffect(() => {
    if (!getApiToken()) {
      router.push("/auth");
    }
  }, [router]);

  const watchedFields = watch();

  const canProceedToNextStep = () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return false;

    // Check if required fields for current step are filled
    return step.fields.every((field) => {
      if (field === "email") return true; // Email is optional
      if (field === "wantsToBeProvider" || field === "wantsToBeSupplier" || field === "wantsToBeInstructor") return true; // Role selections are optional
      if (field === "bio") return true; // Bio is optional
      if (field === "address") {
        const address = watchedFields.address;
        // Address is optional, but if any field is filled, validate structure
        return !address || typeof address === 'object';
      }
      const value = watchedFields[field as keyof OnboardingForm];
      return value && String(value).trim() !== "";
    });
  };

  const handleNext = async () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return;

    // Validate current step fields
    const fieldsToValidate: Array<keyof OnboardingForm | "address.street" | "address.city" | "address.state" | "address.zipCode" | "address.country"> = [];
    
    step.fields.forEach((field) => {
      if (field === "address") {
        // Validate all address sub-fields
        fieldsToValidate.push("address.street", "address.city", "address.state", "address.zipCode", "address.country");
      } else {
        fieldsToValidate.push(field as keyof OnboardingForm);
      }
    });

    const isValid = await trigger(fieldsToValidate as Array<keyof OnboardingForm>);

    if (isValid && canProceedToNextStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleComplete();
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const formData = watch();
      
      // Build address object if any address fields are provided
      const address = formData.address && (
        formData.address.street ||
        formData.address.city ||
        formData.address.state ||
        formData.address.zipCode ||
        formData.address.country
      ) ? {
        street: formData.address.street || undefined,
        city: formData.address.city || undefined,
        state: formData.address.state || undefined,
        zipCode: formData.address.zipCode || undefined,
        country: formData.address.country || undefined,
      } : undefined;
      
      // Build roles array - always include client, add others if selected
      const roles: string[] = ["client"]; // Client is always included
      if (formData.wantsToBeProvider) roles.push("provider");
      if (formData.wantsToBeSupplier) roles.push("supplier");
      if (formData.wantsToBeInstructor) roles.push("instructor");
      
      // Build payload matching the expected structure
      const payload: Record<string, unknown> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roles: roles, // Send roles array
      };
      
      if (formData.email) {
        payload.email = formData.email;
      }
      
      if (formData.bio) {
        payload.bio = formData.bio;
      }
      
      if (address) {
        payload.address = address;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.authCompleteOnboarding}`,
        {
          ...createAuthFetchOptions({ method: "POST" }),
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Profile setup complete! Welcome to LocalPro!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast.error(result.error || result.message || "Failed to complete onboarding");
        logger.error("Onboarding completion failed", new Error(result.error || "Unknown error"), {
          status: response.status,
          result,
        });
      }
    } catch (error) {
      logger.error("Onboarding error", error instanceof Error ? error : new Error(String(error)));
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const currentStepData = steps.find((s) => s.id === currentStep);
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LocalPro!</h1>
          <p className="text-gray-600">Let&apos;s set up your profile to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-600 to-green-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-[60%] w-[80%] h-0.5 z-0 ${
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all relative z-10 ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                      ? "bg-green-100 text-green-700 border-2 border-green-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-medium ${
                      isCurrent ? "text-green-700" : isCompleted ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {currentStepData && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  {currentStepData.icon && (
                    <currentStepData.icon className="w-5 h-5 text-green-700" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
                  <p className="text-sm text-gray-600">{currentStepData.description}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
                {/* Step 1: Name */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        {...register("firstName")}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        {...register("lastName")}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Roles */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Select all that apply. You&apos;ll always have Client access to book services and use platform features.
                    </p>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeProvider")}
                          className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Service Provider</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Offer services, manage your business, create jobs, and earn money by providing services to clients.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeSupplier")}
                          className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Supplier</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Provide supplies and materials to service providers and businesses on the platform.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeInstructor")}
                          className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Instructor</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Create and teach courses, share knowledge, and help others learn new skills through the Academy.
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> You can always add or change your roles later in your profile settings. 
                        Everyone starts as a Client to access basic platform features.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Email */}
                {currentStep === 3 && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        {...register("email")}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        We&apos;ll use this to send you important updates and notifications.
                      </p>
                    </div>
                )}

                {/* Step 4: Bio */}
                {currentStep === 4 && (
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                      {...register("bio")}
                      className={errors.bio ? "border-red-500" : ""}
                      maxLength={500}
                    />
                    {errors.bio && (
                      <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {watch("bio")?.length || 0}/500 characters
                    </p>
                  </div>
                )}

                {/* Step 5: Address */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <Input
                        id="address.street"
                        type="text"
                        placeholder="123 Main St"
                        {...register("address.street")}
                        className={errors.address?.street ? "border-red-500" : ""}
                      />
                      {errors.address?.street && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <Input
                          id="address.city"
                          type="text"
                          placeholder="Manila"
                          {...register("address.city")}
                          className={errors.address?.city ? "border-red-500" : ""}
                        />
                        {errors.address?.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <Input
                          id="address.state"
                          type="text"
                          placeholder="Metro Manila"
                          {...register("address.state")}
                          className={errors.address?.state ? "border-red-500" : ""}
                        />
                        {errors.address?.state && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP/Postal Code <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <Input
                          id="address.zipCode"
                          type="text"
                          placeholder="1000"
                          {...register("address.zipCode")}
                          className={errors.address?.zipCode ? "border-red-500" : ""}
                        />
                        {errors.address?.zipCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-2">
                          Country <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <Input
                          id="address.country"
                          type="text"
                          placeholder="Philippines"
                          {...register("address.country")}
                          className={errors.address?.country ? "border-red-500" : ""}
                        />
                        {errors.address?.country && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.country.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex gap-3">
                    {currentStep < steps.length && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!canProceedToNextStep() || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Completing...
                        </>
                      ) : currentStep === steps.length ? (
                        <>
                          Complete Setup
                          <CheckCircle className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500">
          You can always update your profile later in settings
        </p>
      </div>
    </div>
  );
}

