"use client";

import { useState, useEffect, useContext } from "react";
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
import { SessionContext } from "@/contexts/session-context";

// Schema for basic onboarding information
const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  gender: z.string().min(1, "Gender is required"),
  birthdate: z.string().min(1, "Birthdate is required").refine((date) => {
    const dateObj = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate()) ? age - 1 : age;
    return actualAge >= 13 && actualAge <= 120;
  }, "You must be at least 13 years old and not more than 120 years old"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  wantsToBeClient: z.boolean().optional(),
  wantsToBeProvider: z.boolean().optional(),
  wantsToBeSupplier: z.boolean().optional(),
  wantsToBeInstructor: z.boolean().optional(),
  bio: z.string().min(1, "Bio is required").max(500, "Bio must be less than 500 characters"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    zipCode: z.string().min(1, "ZIP/Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const steps = [
  {
    id: 1,
    title: "Welcome!",
    description: "Let's get to know you",
    icon: User,
    fields: ["firstName", "lastName", "gender", "birthdate"],
  },
  {
    id: 2,
    title: "Your Roles",
    description: "What will you be doing on LocalPro?",
    icon: Shield,
    fields: ["wantsToBeClient", "wantsToBeProvider", "wantsToBeSupplier", "wantsToBeInstructor"],
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
  // Get session context for refreshing session data (may be undefined if not in provider)
  const sessionContext = useContext(SessionContext);
  const sessionContextRefetch = sessionContext?.refetch;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      gender: "",
      birthdate: "",
      wantsToBeClient: true,
      wantsToBeProvider: false,
      wantsToBeSupplier: false,
      wantsToBeInstructor: false,
    },
  });

  // Pre-fill form with session data if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.firstName) setValue("firstName", session.user.firstName);
      if (session.user.lastName) setValue("lastName", session.user.lastName);
      if (session.user.email) setValue("email", session.user.email);
      // Pre-fill gender and birthdate if available in session
      // These fields may exist on the user object even if not in the type definition
      const userWithExtendedFields = session.user as typeof session.user & {
        gender?: string;
        birthdate?: string;
      };
      if (userWithExtendedFields.gender) setValue("gender", userWithExtendedFields.gender);
      if (userWithExtendedFields.birthdate) setValue("birthdate", userWithExtendedFields.birthdate);
      // Pre-select roles if user has roles
      if (session.user.roles && session.user.roles.length > 0) {
        if (session.user.roles.includes("client")) setValue("wantsToBeClient", true);
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

  const canProceedToNextStep = () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return false;

    // Use getValues for more reliable form state access
    const formValues = getValues();

    // Check if required fields for current step are filled
    const allFieldsValid = step.fields.every((field) => {
      if (field === "email") {
        // Email is optional - allow proceeding
        return true;
      }
      if (
        field === "wantsToBeClient" ||
        field === "wantsToBeProvider" ||
        field === "wantsToBeSupplier" ||
        field === "wantsToBeInstructor"
      ) {
        // At least one role must be selected (including client)
        return (
          formValues.wantsToBeClient ||
          formValues.wantsToBeProvider ||
          formValues.wantsToBeSupplier ||
          formValues.wantsToBeInstructor
        );
      }
      if (field === "bio") {
        // Bio is required
        const bio = formValues.bio;
        return bio && String(bio).trim() !== "";
      }
      if (field === "address") {
        // Address is required - all fields must be filled
        const address = formValues.address;
        return address && 
               address.street && address.street.trim() !== "" &&
               address.city && address.city.trim() !== "" &&
               address.state && address.state.trim() !== "" &&
               address.zipCode && address.zipCode.trim() !== "" &&
               address.country && address.country.trim() !== "";
      }
      const value = formValues[field as keyof OnboardingForm];
      const isValid = value !== undefined && value !== null && String(value).trim() !== "";
      return isValid;
    });
    
    return allFieldsValid;
  };

  const handleNext = async () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return;

    // Validate current step fields
    const fieldsToValidate: Array<keyof OnboardingForm | "address.street" | "address.city" | "address.state" | "address.zipCode" | "address.country"> = [];
    
    step.fields.forEach((field) => {
      if (field === "email") {
        // Email is optional - skip validation if empty
        const email = watch("email");
        if (email && email.trim() !== "") {
          fieldsToValidate.push("email");
        }
      } else if (field === "address") {
        // Validate all address sub-fields
        fieldsToValidate.push("address.street", "address.city", "address.state", "address.zipCode", "address.country");
      } else if (field !== "wantsToBeProvider" && field !== "wantsToBeSupplier" && field !== "wantsToBeInstructor") {
        // Validate other required fields (roles are validated in canProceedToNextStep)
        fieldsToValidate.push(field as keyof OnboardingForm);
      }
    });

    const isValid = fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate as Array<keyof OnboardingForm>);

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
      const wantsClientRole = formData.wantsToBeClient ?? true;
      
      // Validate that at least one role is selected
      if (
        !wantsClientRole &&
        !formData.wantsToBeProvider &&
        !formData.wantsToBeSupplier &&
        !formData.wantsToBeInstructor
      ) {
        toast.error("Please select at least one role (including Client).");
        setIsSubmitting(false);
        return;
      }
      
      // Build address object - all fields are required
      const address = {
        street: formData.address.street,
        city: formData.address.city,
        state: formData.address.state,
        zipCode: formData.address.zipCode,
        country: formData.address.country,
      };
      
      // Build roles array - always include client, add others if selected
      const roles: string[] = [];
      const shouldIncludeClient =
        wantsClientRole ||
        formData.wantsToBeProvider ||
        formData.wantsToBeSupplier ||
        formData.wantsToBeInstructor;
      if (shouldIncludeClient) roles.push("client"); // Client is always included
      if (formData.wantsToBeProvider) roles.push("provider");
      if (formData.wantsToBeSupplier) roles.push("supplier");
      if (formData.wantsToBeInstructor) roles.push("instructor");
      
      // Build profile object with required fields
      const profile: Record<string, unknown> = {
        bio: formData.bio,
        address: address,
      };
      
      // Build payload matching the expected structure
      // Only include explicitly required fields to avoid sending unwanted data
      const payload: Record<string, unknown> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        birthdate: formData.birthdate,
        roles: roles, // Send roles array
      };
      
      // Email is optional - only include if provided
      const email = formData.email || session?.user?.email || "";
      if (email && email.trim() !== "") {
        payload.email = email;
      }
      
      // Always include profile with required fields
      payload.profile = profile;
      
      // Clean the payload to ensure no unwanted fields are included
      // This prevents issues with backend trying to cast referral objects to ObjectId
      // JSON.parse(JSON.stringify()) removes any non-serializable objects like Buffer
      const cleanPayload = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
      
      // Explicitly remove any referral-related fields that might have been included
      delete cleanPayload.referral;
      delete cleanPayload.referredBy;
      if (cleanPayload.profile && typeof cleanPayload.profile === 'object') {
        const profile = cleanPayload.profile as Record<string, unknown>;
        delete profile.referral;
      }
      
      logger.debug("Onboarding payload", { payload: cleanPayload });
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.authCompleteOnboarding}`,
        {
          ...createAuthFetchOptions({ method: "POST" }),
          body: JSON.stringify(cleanPayload),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh session data to reflect updated user information
        if (sessionContextRefetch) {
          sessionContextRefetch().catch((error) => {
            logger.warn('Failed to refresh session after onboarding completion', {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
        toast.success("Profile setup complete! Welcome to LocalPro!");
        setIsRedirecting(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast.error(result.error || result.message || "Failed to complete onboarding");
        logger.error("Onboarding completion failed", new Error(result.error || result.message || "Unknown error"), {
          status: response.status,
          result,
          payload,
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
    // Only allow skipping the email step (step 3) since it's optional
    if (currentStep === 3) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleComplete();
      }
      return;
    }
    
    // All other steps are required, so don't allow skipping
    toast.error("Please complete all required fields before proceeding.");
  };

  const currentStepData = steps.find((s) => s.id === currentStep);
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-white to-primary/10 flex items-center justify-center p-4 relative">
      {/* Loading Overlay for Redirect */}
      {isRedirecting && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Setup Complete!</h3>
              <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent rounded-2xl mb-4 shadow-lg">
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
              className="bg-gradient-to-r from-accent to-accent h-2 rounded-full transition-all duration-300"
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
                      isCompleted ? "bg-accent" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all relative z-10 ${
                    isCompleted
                      ? "bg-accent text-white"
                      : isCurrent
                      ? "bg-accent/10 text-accent border-2 border-accent"
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
                      isCurrent ? "text-accent" : isCompleted ? "text-gray-700" : "text-gray-400"
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
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  {currentStepData.icon && (
                    <currentStepData.icon className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
                  <p className="text-sm text-gray-600">{currentStepData.description}</p>
                </div>
              </div>

              <form className="space-y-6">
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
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        {...register("gender")}
                        className={`w-full px-4 py-3 pr-10 bg-white border rounded-lg text-gray-700 focus:outline-none transition-all duration-200 shadow-sm appearance-none ${
                          errors.gender 
                            ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                            : "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-ring focus:border-accent"
                        }`}
                      >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="birthdate"
                        type="date"
                        {...register("birthdate")}
                        className={errors.birthdate ? "border-red-500" : ""}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                      />
                      {errors.birthdate && (
                        <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Roles */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Select at least one role. Client is selected by default so you can book services and use platform features. <span className="text-red-500">*</span>
                    </p>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeClient")}
                          className="mt-1 w-5 h-5 text-accent border-gray-300 rounded focus:ring-ring"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Client only</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Book services, chat with providers, and use platform features without offering services yourself.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeProvider")}
                          className="mt-1 w-5 h-5 text-accent border-gray-300 rounded focus:ring-ring"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Service Provider</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Offer services, manage your business, create jobs, and earn money by providing services to clients.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeSupplier")}
                          className="mt-1 w-5 h-5 text-accent border-gray-300 rounded focus:ring-ring"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Supplier</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Provide supplies and materials to service providers and businesses on the platform.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          {...register("wantsToBeInstructor")}
                          className="mt-1 w-5 h-5 text-accent border-gray-300 rounded focus:ring-ring"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Instructor</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Create and teach courses, share knowledge, and help others learn new skills through the Academy.
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
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
                      Bio <span className="text-red-500">*</span>
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
                        Street Address <span className="text-red-500">*</span>
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
                          City <span className="text-red-500">*</span>
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
                          State/Province <span className="text-red-500">*</span>
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
                          ZIP/Postal Code <span className="text-red-500">*</span>
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
                          Country <span className="text-red-500">*</span>
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
                    {currentStep < steps.length && currentStep === 3 && (
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
                      disabled={isSubmitting}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!canProceedToNextStep()) {
                          const step = steps.find((s) => s.id === currentStep);
                          if (step) {
                            const formValues = getValues();
                            const missingFields = step.fields.filter((field) => {
                              if (field === "email") return false;
                              if (field === "wantsToBeProvider" || field === "wantsToBeSupplier" || field === "wantsToBeInstructor") {
                                return !formValues.wantsToBeProvider && !formValues.wantsToBeSupplier && !formValues.wantsToBeInstructor;
                              }
                              const value = formValues[field as keyof OnboardingForm];
                              return !value || String(value).trim() === "";
                            });
                            if (missingFields.length > 0) {
                              toast.error(`Please fill in: ${missingFields.join(", ")}`);
                            } else {
                              toast.error("Please fill in all required fields");
                            }
                          }
                          return;
                        }
                        await handleNext();
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-accent to-accent text-white rounded-lg hover:from-accent hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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

