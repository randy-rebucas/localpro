"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

const signInSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number"),
});

type SignInForm = z.infer<typeof signInSchema>;

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect parameter from URL
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const sendVerificationCode = async (phone: string) => {
    setIsLoading(true);
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
        setIsNewUser(result.isNewUser || false);
        setStep("code");
        toast.success("Verification code sent to your phone!");
      } else {
        // Handle specific error cases
        if (response.status === 408) {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (response.status === 503) {
          toast.error("Service temporarily unavailable. Please try again in a few moments.");
        } else {
          toast.error(result.error || "Failed to send verification code");
        }
      }
    } catch (error) {
      console.error("Send code error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndSignIn = async () => {
    setIsLoading(true);
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
          firstName: firstName,
          lastName: lastName,
          email: email || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Signed in successfully!");
        // The session cookie is automatically set by the server
        // Redirect to intended destination or dashboard
        router.push(redirectTo);
      } else {
        toast.error(result.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("Verify code error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("An error occurred during verification");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignInForm) => {
    await sendVerificationCode(data.phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-700">
            Sign in to LocalPro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your professional services dashboard
          </p>
        </div>
        
        {step === "phone" ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <Input
                  label="Phone Number"
                  {...register("phone")}
                  type="tel"
                  leftIcon={<Phone />}
                  placeholder="Enter your phone number"
                  error={errors.phone?.message}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending Code..." : "Send Verification Code"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve sent a verification code to:
              </p>
              <p className="font-medium text-gray-700">{phoneNumber}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Verification Code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  maxLength={8}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>

            {isNewUser && (
              <>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="First Name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Last Name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={verifyAndSignIn}
                disabled={isLoading || !verificationCode}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => sendVerificationCode(phoneNumber)}
                disabled={isLoading}
                className="text-sm text-green-600 hover:text-green-500"
              >
                Resend Code
              </button>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
