"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Phone, 
  ArrowRight, 
  Shield, 
  CheckCircle, 
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";

const signInSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"),
});

const verificationSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain exactly 6 numbers"),
});

// Removed newUserSchema - firstName, lastName, and email will be handled in profile completion

type SignInForm = z.infer<typeof signInSchema>;
// type VerificationForm = z.infer<typeof verificationSchema>;
// type NewUserForm = z.infer<typeof newUserSchema>;

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  // const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect parameter from URL
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, [searchParams]);

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus verification code input
  useEffect(() => {
    if (step === "code") {
      const codeInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (codeInput) {
        setTimeout(() => codeInput.focus(), 100);
      }
    }
  }, [step]);

  const {
    register,
    handleSubmit,
    formState: { errors: phoneErrors },
    clearErrors,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  // const {
  //   register: registerCode,
  //   handleSubmit: handleCodeSubmit,
  //   formState: { errors: codeErrors },
  // } = useForm<VerificationForm>({
  //   resolver: zodResolver(verificationSchema),
  // });

  // const {
  //   register: registerNewUser,
  //   handleSubmit: handleNewUserSubmit,
  //   formState: { errors: newUserErrors },
  // } = useForm<NewUserForm>({
  //   resolver: zodResolver(newUserSchema),
  // });

  const sendVerificationCode = async (phone: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout to allow for backend retries

      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok) {
        setPhoneNumber(phone);
        setStep("code");
        setCountdown(60); // 60 second countdown
        toast.success("Verification code sent to your phone!");
        clearErrors();
      } else {
        // Handle specific error cases
        if (response.status === 408) {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (response.status === 503) {
          toast.error("Service temporarily unavailable. Please try again in a few moments.");
        } else if (response.status === 429) {
          toast.error("Too many requests. Please wait before trying again.");
        } else {
          toast.error(result.error || "Failed to send verification code");
        }
        setErrors({ phone: result.error || "Failed to send verification code" });
      }
    } catch (error) {
      console.error("Send code error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
      setErrors({ phone: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const verifyAndSignIn = async () => {
    // Validate verification code
    const codeValidation = verificationSchema.safeParse({ code: verificationCode });
    if (!codeValidation.success) {
      setErrors({ code: codeValidation.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout to allow for backend retries

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Signed in successfully!");
        // The session cookie is automatically set by the server
        // Redirect to intended destination or dashboard
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      } else {
        if (response.status === 400) {
          toast.error(result.error || "Invalid verification code");
          setErrors({ code: result.error || "Invalid verification code" });
        } else if (response.status === 429) {
          toast.error("Too many attempts. Please wait before trying again.");
        } else {
          toast.error(result.error || "Verification failed");
          setErrors({ code: result.error || "Verification failed" });
        }
      }
    } catch (error) {
      console.error("Verify code error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("An error occurred during verification");
      }
      setErrors({ code: "An error occurred during verification" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const onSubmit = async (data: SignInForm) => {
    await sendVerificationCode(data.phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8" role="main" aria-label="Authentication form">
        {/* Header with enhanced design */}
        <div className={`transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="text-white w-10 h-10" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Welcome to LocalPro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "phone" 
              ? "Enter your phone number to get started"
              : "Enter the verification code sent to your phone"
            }
          </p>
        </div>
        
        {step === "phone" ? (
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Phone Number"
                    {...register("phone")}
                    type="tel"
                    leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
                    placeholder="+1 (555) 123-4567"
                    error={phoneErrors.phone?.message || errors.phone}
                    className="text-lg"
                    autoComplete="tel"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We&apos;ll send you a verification code via SMS
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            <div className="mt-8 space-y-6">
              {/* Phone number confirmation */}
              <div className="text-center bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">Code sent successfully!</p>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  We&apos;ve sent a verification code to:
                </p>
                <p className="font-semibold text-gray-800">{phoneNumber}</p>
              </div>

              {/* Verification code input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Verification Code
                  </label>
                  <VerificationCodeInput
                    value={verificationCode}
                    onChange={(code) => {
                      setVerificationCode(code);
                      setErrors({ ...errors, code: "" });
                    }}
                    onComplete={(code) => {
                      // Auto-submit when code is complete
                      if (code.length === 6) {
                        verifyAndSignIn();
                      }
                    }}
                    error={errors.code}
                    disabled={isLoading}
                    length={6}
                  />
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Enter the 6-digit code from your SMS message
                  </p>
                </div>
              </div>

            
              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setVerificationCode("");
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={verifyAndSignIn}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>
              </div>

              {/* Resend code section */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCountdown(60);
                      sendVerificationCode(phoneNumber);
                    }}
                    disabled={isLoading || countdown > 0}
                    className="text-sm text-green-600 hover:text-green-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                  </button>
                  {countdown > 0 && (
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Didn&apos;t receive the code? Check your spam folder or try again.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
