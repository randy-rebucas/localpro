"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PhoneInput } from "@/components/ui/phone-input";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { phoneFormatter } from "@/lib/phone-formatter";
import { logger } from "@/lib/logger";

const signInSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.trim())
    .refine((phone) => !phone.includes(' '), "Phone number should not contain spaces")
    .refine((phone) => {
      const digits = phone.replace(/[\D\s]/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, "Phone number must be between 7 and 15 digits")
    .refine((phone) => {
      return phone.startsWith('+') || (phone.replace(/[\D\s]/g, '').length >= 7);
    }, "Please enter a valid phone number"),
});

const verificationSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain exactly 6 numbers"),
});

type SignInForm = z.infer<typeof signInSchema>;

export function MobileAuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (step === "code") {
      const codeInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (codeInput) {
        setTimeout(() => codeInput.focus(), 100);
      }
    }
  }, [step]);

  const {
    handleSubmit,
    formState: { errors: phoneErrors },
    clearErrors,
    setValue,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const sendVerificationCode = async (phone: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ phone: "Service configuration error" });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authSendCode', {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phone.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (response.ok) {
        setPhoneNumber(phone);
        setStep("code");
        setCountdown(60);
        toast.success("Verification code sent to your phone!");
        clearErrors();
      } else {
        if (response.status === 408) {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (response.status === 503) {
          const errorMsg = result.details ? `${result.error} - ${result.details}` : result.error;
          toast.error(errorMsg || "Service temporarily unavailable. Please try again in a few moments.");
        } else if (response.status === 429) {
          toast.error("Too many requests. Please wait before trying again.");
        } else {
          const errorMsg = result.details ? `${result.error} - ${result.details}` : result.error;
          toast.error(errorMsg || "Failed to send verification code");
        }
        setErrors({ phone: result.error || "Failed to send verification code" });
      }
    } catch (error) {
      logger.error("Send code error", error instanceof Error ? error : new Error(String(error)));
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
    const codeValidation = verificationSchema.safeParse({ code: verificationCode });
    if (!codeValidation.success) {
      setErrors({ code: codeValidation.error.errors[0].message });
      return;
    }

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ code: "Service configuration error" });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authVerifyCode', {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (response.ok && result.success) {
        if (result.token) {
          const oneWeek = 60 * 60 * 24 * 7;
          const isProd = process.env.NODE_ENV === 'production';
          const secure = isProd ? '; Secure' : '';
          const sameSite = '; SameSite=Lax';
          document.cookie = `api-token=${result.token}; Path=/; Max-Age=${oneWeek}${sameSite}${secure}`;
        }
        if (result.user) {
          try { localStorage.setItem('user', JSON.stringify(result.user)); } catch {}
        }
        toast.success("Signed in successfully!");
        setTimeout(() => {
          // Redirect to onboarding if new user, otherwise reload to current page
          if (result.isNewUser === true) {
            window.location.href = '/onboarding';
          } else {
            window.location.reload();
          }
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
      logger.error("Verify code error", error instanceof Error ? error : new Error(String(error)));
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
        setErrors({ code: "Request timed out. Please try again." });
      } else {
        toast.error("An error occurred during verification");
        setErrors({ code: "An error occurred during verification" });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const onSubmit = async (data: SignInForm) => {
    if (data.phone) {
      const formattedPhone = phoneFormatter.formatPhoneNumber(data.phone);
      const validation = phoneFormatter.validatePhoneNumber(formattedPhone);
      if (!validation.isValid) {
        setErrors({ phone: validation.error || "Invalid phone number" });
        return;
      }
      await sendVerificationCode(formattedPhone);
    } else {
      setErrors({ phone: "Please enter a valid phone number" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className={`transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
          <div className="flex justify-center">
            <Image
              src="/logo-only.svg"
              alt="LocalPro logo"
              width={80}
              height={80}
              priority
              className="rounded-md object-contain"
              unoptimized
            />
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
                  <PhoneInput
                    value={phoneNumber}
                    onChange={(value) => {
                      setPhoneNumber(value);
                      setValue('phone', value);
                      if (errors.phone) {
                        setErrors({ ...errors, phone: "" });
                      }
                      clearErrors();
                    }}
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

