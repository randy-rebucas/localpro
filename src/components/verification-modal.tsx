"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

const verificationSchema = z.object({
  code: z.string().min(4, "Code must be at least 4 digits").max(8, "Code must be at most 8 digits"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact: string;
}

export function VerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  contact 
}: VerificationModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
  });

  const onSubmit = async (data: VerificationForm) => {
    setIsLoading(true);
    try {
      const response = await makeClientPublicRequest(API_ENDPOINTS.authVerifyCode as keyof typeof API_ENDPOINTS, {
        method: "POST",
        body: JSON.stringify({
          phone: contact,
          code: data.code,
          type: "phone",
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Persist API token client-side for secure REST API requests
        // The token from mobile authentication response will be used in Authorization: Bearer header
        if (result.token) {
          const oneWeek = 60 * 60 * 24 * 7;
          const isProd = process.env.NODE_ENV === 'production';
          const secure = isProd ? '; Secure' : '';
          const sameSite = '; SameSite=Lax';
          document.cookie = `api-token=${result.token}; Path=/; Max-Age=${oneWeek}${sameSite}${secure}`;
          logger.debug('API token stored for Bearer authentication');
        }
        setIsVerified(true);
        toast.success("Verification successful!");
        setTimeout(() => {
          onSuccess();
          onClose();
          // Redirect to marketplace after successful mobile authentication
          router.push("/marketplace");
        }, 1500);
      } else {
        toast.error(result.error || "Invalid verification code");
      }
    } catch (error) {
      logger.error("Verification error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsResending(true);
    try {
      const response = await makeClientPublicRequest(API_ENDPOINTS.authSendCode as keyof typeof API_ENDPOINTS, {
        method: "POST",
        body: JSON.stringify({
          phone: contact,
          type: "phone",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Verification code sent!");
      } else {
        toast.error(result.error || "Failed to send verification code");
      }
    } catch (error) {
      logger.error("Resend error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {isVerified ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Verification Successful!
            </h2>
            <p className="text-gray-600">
              Your phone number has been verified successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-700">
                Verify Phone Number
              </h2>
            </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                We&apos;ve sent a verification code to:
              </p>
              <p className="font-medium text-gray-700">{contact}</p>
            <p className="text-sm text-gray-500 mt-2">
              Please enter the code below to verify your phone number.
            </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  {...register("code")}
                  type="text"
                  placeholder="Enter verification code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest"
                  maxLength={8}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={isResending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the code? Check your spam folder or try resending.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
