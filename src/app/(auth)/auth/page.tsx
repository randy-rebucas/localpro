"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Shield,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { VerificationCodeInput } from "@/components/ui/verification-code-input";
import { phoneFormatter } from "@/lib/phone-formatter";
import { API_BASE_URL } from "@/lib/api";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { logger } from "@/lib/logger";
import { setAuthToken, setRefreshToken } from "@/lib/utils/cookies";
import { initializeTokenTracking } from "@/lib/utils/token-refresh";
import { initializeSession } from "@/lib/utils/session-manager";

// Phone authentication schemas
const phoneSchema = z.object({
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

const codeSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain exactly 6 numbers"),
});

// Email authentication schemas
const emailCheckSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const emailLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const emailRegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const emailSetupPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const emailOtpSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain exactly 6 numbers"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type CodeForm = z.infer<typeof codeSchema>;
type EmailCheckForm = z.infer<typeof emailCheckSchema>;
type EmailLoginForm = z.infer<typeof emailLoginSchema>;
type EmailRegisterForm = z.infer<typeof emailRegisterSchema>;
type EmailSetupPasswordForm = z.infer<typeof emailSetupPasswordSchema>;
type EmailOtpForm = z.infer<typeof emailOtpSchema>;

type AuthMethod = "phone" | "email";
type PhoneStep = "phone" | "code";
type EmailStep = "email-check" | "email-login" | "email-register" | "email-setup-password" | "email-otp";

// Error code mapping
const ERROR_CODE_MAP: Record<string, string> = {
  MISSING_REQUIRED_FIELDS: "Please fill in all required fields",
  INVALID_PHONE_FORMAT: "Invalid phone number format. Please use international format (e.g., +1234567890)",
  INVALID_CODE_FORMAT: "Code must be exactly 6 digits",
  INVALID_VERIFICATION_CODE: "Invalid or expired verification code",
  VERIFICATION_SERVICE_ERROR: "Unable to send verification code. Please try again later",
  DATABASE_UNAVAILABLE: "Service temporarily unavailable. Please try again later",
  DATABASE_ERROR: "An error occurred. Please try again",
  INTERNAL_SERVER_ERROR: "Server error. Please try again later",
  INVALID_EMAIL_FORMAT: "Please enter a valid email address",
  PASSWORD_NOT_SET: "Password not set for this email",
  NO_PASSWORD: "Password not set for this email",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
};

function getErrorMessage(error: { code?: string; message?: string } | null | undefined, status: number): string {
  if (error?.code && ERROR_CODE_MAP[error.code]) {
    return ERROR_CODE_MAP[error.code];
  }
  
  if (error?.message) {
    return error.message;
  }
  
  // Fallback to status-based messages
  switch (status) {
    case 0:
      return "Network error - Please check your connection and try again.";
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Invalid credentials. Please try again.";
    case 404:
      return "Not found. Please check your information and try again.";
    case 429:
      return "Too many requests. Please wait before trying again.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Auth method and steps
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [emailStep, setEmailStep] = useState<EmailStep>("email-check");
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  
  // Email state
  const [email, setEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  // Forms
  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
  });

  const emailCheckForm = useForm<EmailCheckForm>({
    resolver: zodResolver(emailCheckSchema),
  });

  const emailLoginForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  const emailRegisterForm = useForm<EmailRegisterForm>({
    resolver: zodResolver(emailRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const emailSetupPasswordForm = useForm<EmailSetupPasswordForm>({
    resolver: zodResolver(emailSetupPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const emailOtpForm = useForm<EmailOtpForm>({
    resolver: zodResolver(emailOtpSchema),
  });

  // Get redirect parameter from URL
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, [searchParams]);

  // Check if user already authenticated (only once on mount)
  const hasCheckedAuth = useRef(false);
  const redirectingRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple checks and redirects
    if (hasCheckedAuth.current || redirectingRef.current || typeof window === 'undefined') return;
    
    // Only check once
    hasCheckedAuth.current = true;
    
    // Use requestIdleCallback if available for better performance, otherwise use minimal delay
    const checkAuth = () => {
      if (redirectingRef.current) return;
      
      const cookies = document.cookie.split(';');
      const hasToken = cookies.some(c => {
        const trimmed = c.trim();
        return trimmed.startsWith('auth_token=') || trimmed.startsWith('api-token=');
      });
      
      if (hasToken && !redirectingRef.current) {
        redirectingRef.current = true;
        const redirect = searchParams.get("redirect") || "/dashboard";
        const safeRedirect = redirect.startsWith('/auth') ? '/dashboard' : redirect;
        // Use router.push instead of window.location.href to avoid full page reload
        router.push(safeRedirect);
      }
    };
    
    // Use requestIdleCallback for non-blocking check, fallback to setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(checkAuth, { timeout: 200 });
    } else {
      // Minimal delay only if needed
      setTimeout(checkAuth, 0);
    }
  }, [searchParams, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if ((phoneStep === "code" || emailStep === "email-otp") && typeof window !== 'undefined') {
      setTimeout(() => {
        const codeInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (codeInput) {
          codeInput.focus();
        }
      }, 100);
    }
  }, [phoneStep, emailStep]);

  // Auto-focus email input on email-check step
  useEffect(() => {
    if (emailStep === "email-check" && typeof window !== 'undefined') {
      setTimeout(() => {
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        if (emailInput && !emailInput.readOnly) {
          emailInput.focus();
        }
      }, 100);
    }
  }, [emailStep]);

  // Reset forms when auth method changes
  useEffect(() => {
    if (authMethod === "phone") {
      setPhoneStep("phone");
      setPhoneNumber("");
      setPhoneCode("");
      phoneForm.reset();
      codeForm.reset();
    } else {
      setEmailStep("email-check");
      setEmail("");
      setEmailOtpCode("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      emailCheckForm.reset();
      emailLoginForm.reset();
      emailRegisterForm.reset();
      emailSetupPasswordForm.reset();
      emailOtpForm.reset();
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMethod]);

  // Phone: Send verification code
  const sendPhoneCode = async (phone: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);
    
    const formattedPhone = phoneFormatter.formatPhoneNumber(phone.trim());
    const validation = phoneFormatter.validatePhoneNumber(formattedPhone);
    
    if (!validation.isValid) {
      const errorMsg = validation.error || "Invalid phone number format";
      toast.error(errorMsg);
      setErrors({ phone: errorMsg });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

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
        body: JSON.stringify({ phoneNumber: formattedPhone }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        setPhoneNumber(formattedPhone);
        setPhoneStep("code");
        setCountdown(60);
        toast.success("Verification code sent to your phone!");
        phoneForm.clearErrors();
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ phone: errorMsg });
      }
    } catch (error) {
      logger.error("Send code error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ phone: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Phone: Verify code and sign in
  const verifyPhoneCode = async () => {
    const codeValidation = codeSchema.safeParse({ code: phoneCode });
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
          code: phoneCode,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        await handleAuthSuccess(result);
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ code: errorMsg });
      }
    } catch (error) {
      logger.error("Verify code error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ code: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Email: Check email status
  const checkEmailStatus = async (emailAddress: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ email: "Service configuration error" });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authCheckEmail', {
        method: "POST",
        body: JSON.stringify({ email: emailAddress }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        setEmail(emailAddress);
        if (result.exists && result.hasPassword) {
          setEmailStep("email-login");
          emailLoginForm.reset({ password: "" });
        } else if (result.exists && !result.hasPassword) {
          setEmailStep("email-setup-password");
          emailSetupPasswordForm.reset({ email: emailAddress, password: "", confirmPassword: "" });
        } else {
          setEmailStep("email-register");
          emailRegisterForm.reset({ email: emailAddress, password: "", firstName: "", lastName: "" });
        }
        emailCheckForm.clearErrors();
        setErrors({});
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ email: errorMsg });
      }
    } catch (error) {
      logger.error("Check email error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ email: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Email: Login with password
  const loginEmail = async (emailAddress: string, password: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ password: "Service configuration error" });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authLoginEmail', {
        method: "POST",
        body: JSON.stringify({ email: emailAddress, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        setEmailStep("email-otp");
        setEmailOtpCode("");
        setShowPassword(false);
        setCountdown(60);
        toast.success("Verification code sent to your email!");
        emailLoginForm.clearErrors();
        emailOtpForm.reset();
        setErrors({});
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ password: errorMsg });
      }
    } catch (error) {
      logger.error("Login email error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ password: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Email: Register new user
  const registerEmail = async (data: EmailRegisterForm) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ email: "Service configuration error" });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authRegisterEmail', {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        setEmailStep("email-otp");
        setEmailOtpCode("");
        setShowPassword(false);
        setCountdown(60);
        toast.success("Verification code sent to your email!");
        emailRegisterForm.clearErrors();
        emailOtpForm.reset();
        setErrors({});
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ email: errorMsg });
      }
    } catch (error) {
      logger.error("Register email error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ email: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Email: Set password for existing user
  const setPassword = async (emailAddress: string, password: string) => {
    setIsLoading(true);
    setErrors({});
    setIsAnimating(true);

    if (!API_BASE_URL) {
      toast.error("Service configuration error. Please refresh the page and try again.");
      setErrors({ password: "Service configuration error" });
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await makeClientPublicRequest('authSetPassword', {
        method: "POST",
        body: JSON.stringify({ email: emailAddress, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        // After setting password, automatically login and send OTP
        emailSetupPasswordForm.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        await loginEmail(emailAddress, password);
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ password: errorMsg });
      }
    } catch (error) {
      logger.error("Set password error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ password: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Email: Verify OTP
  const verifyEmailOtp = async () => {
    const codeValidation = emailOtpSchema.safeParse({ code: emailOtpCode });
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

      const response = await makeClientPublicRequest('authVerifyEmailOtp', {
        method: "POST",
        body: JSON.stringify({
          email,
          otpCode: emailOtpCode,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        logger.error("Failed to parse response", parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        await handleAuthSuccess(result);
      } else {
        const errorMsg = getErrorMessage(result, response.status);
        toast.error(errorMsg);
        setErrors({ code: errorMsg });
      }
    } catch (error) {
      logger.error("Verify email OTP error", error instanceof Error ? error : new Error(String(error)));
      const errorMsg = error instanceof Error && error.name === 'AbortError'
        ? "Request timed out. Please try again."
        : "Network error. Please check your connection and try again.";
      toast.error(errorMsg);
      setErrors({ code: errorMsg });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = async (result: {
    token: string;
    refreshToken: string;
    user?: {
      firstName?: string;
      lastName?: string;
      [key: string]: unknown;
    };
    isNewUser?: boolean;
  }) => {
    if (result.token && result.refreshToken) {
      try {
        // 1. Store tokens in cookies (both auth_token and api-token for compatibility)
        setAuthToken(result.token);
        setRefreshToken(result.refreshToken);
        
        // Also set api-token cookie for backward compatibility with existing API client
        if (typeof window !== 'undefined') {
          const oneWeek = 60 * 60 * 24 * 7;
          const isProd = process.env.NODE_ENV === 'production';
          const secure = isProd ? '; Secure' : '';
          const sameSite = process.env.NODE_ENV === 'production' ? '; SameSite=Strict' : '; SameSite=Lax';
          document.cookie = `api-token=${result.token}; Path=/; Max-Age=${oneWeek}${sameSite}${secure}`;
        }

        // 2. Initialize token refresh tracking (with error handling)
        try {
          initializeTokenTracking(result.token, result.refreshToken);
        } catch (tokenError) {
          logger.warn('Failed to initialize token tracking', { error: tokenError instanceof Error ? tokenError.message : String(tokenError) });
          // Continue even if token tracking fails - tokens are still stored
        }

        // 3. Initialize session tracking (with error handling)
        try {
          initializeSession();
        } catch (sessionError) {
          logger.warn('Failed to initialize session tracking', { error: sessionError instanceof Error ? sessionError.message : String(sessionError) });
          // Continue even if session tracking fails
        }

        // 4. Store user data in localStorage
        if (result.user && typeof window !== 'undefined') {
          try {
            localStorage.setItem("user", JSON.stringify(result.user));
            if (result.isNewUser) {
              localStorage.setItem("isNewUser", "true");
            } else {
              localStorage.removeItem("isNewUser");
            }
          } catch (storageError) {
            logger.warn('Failed to store user data in localStorage', { error: storageError instanceof Error ? storageError.message : String(storageError) });
          }
        }

        toast.success("Signed in successfully!");

        // 5. Redirect based on profile completion
        const destination = result.isNewUser || !result.user?.firstName || !result.user?.lastName
          ? '/onboarding'
          : redirectTo;
        
        // Prevent multiple redirects - use requestIdleCallback for better performance
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          const performRedirect = () => {
            router.push(destination);
          };
          
          // Use requestIdleCallback if available, otherwise use setTimeout
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            requestIdleCallback(performRedirect, { timeout: 500 });
          } else {
            setTimeout(performRedirect, 500);
          }
        }
      } catch (error) {
        logger.error('Error in handleAuthSuccess', error instanceof Error ? error : new Error(String(error)));
        toast.error("An error occurred during authentication. Please try again.");
        setErrors({ general: "Authentication error. Please try again." });
      }
    } else {
      toast.error("Authentication failed. Missing tokens.");
      setErrors({ general: "Authentication failed. Please try again." });
    }
  };

  // Get current step title and description
  const getStepInfo = () => {
    if (authMethod === "phone") {
      return {
        title: "Welcome Back",
        description: phoneStep === "phone"
          ? "Enter your phone number to get started"
          : "Enter the verification code sent to your phone",
      };
    } else {
      switch (emailStep) {
        case "email-check":
          return {
            title: "Welcome Back",
            description: "Enter your email address to continue",
          };
        case "email-login":
          return {
            title: "Enter Password",
            description: "Enter your password to continue",
          };
        case "email-register":
          return {
            title: "Create Account",
            description: "Enter your information to create an account",
          };
        case "email-setup-password":
          return {
            title: "Set Password",
            description: "Create a password for your account",
          };
        case "email-otp":
          return {
            title: "Verify Email",
            description: "Enter the verification code sent to your email",
          };
        default:
          return {
            title: "Welcome Back",
            description: "Sign in to continue",
          };
      }
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="w-full space-y-6" role="main" aria-label="Authentication form">
      {/* Auth Method Tabs */}
      <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setAuthMethod("email")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            authMethod === "email"
              ? "bg-emerald-500 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("phone")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            authMethod === "phone"
              ? "bg-emerald-500 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Phone</span>
        </button>
      </div>

      {/* Header */}
      <div className={`transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        <h2 className="text-center text-2xl font-bold text-white">
          {stepInfo.title}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {stepInfo.description}
        </p>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <p className="text-sm text-destructive text-center">{errors.general}</p>
        </div>
      )}

      {/* Phone Authentication */}
      {authMethod === "phone" && (
        <>
          {phoneStep === "phone" ? (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <form className="mt-6 space-y-6" onSubmit={phoneForm.handleSubmit((data) => {
                const formattedPhone = phoneFormatter.formatPhoneNumber(data.phone);
                const validation = phoneFormatter.validatePhoneNumber(formattedPhone);
                if (!validation.isValid) {
                  setErrors({ phone: validation.error || "Invalid phone number" });
                  return;
                }
                sendPhoneCode(formattedPhone);
              })}>
                <div className="space-y-4">
                  <div>
                    <PhoneInput
                      value={phoneNumber}
                      onChange={(value) => {
                        setPhoneNumber(value);
                        phoneForm.setValue('phone', value);
                        if (errors.phone) {
                          setErrors({ ...errors, phone: "" });
                        }
                        phoneForm.clearErrors();
                      }}
                      error={phoneForm.formState.errors.phone?.message || errors.phone}
                      autoComplete="tel"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      We&apos;ll send you a verification code via SMS
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-3.5 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
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
              <div className="mt-6 space-y-6">
                <div className="text-center bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                    <p className="text-sm font-medium text-emerald-400">Code sent successfully!</p>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">
                    We&apos;ve sent a verification code to:
                  </p>
                  <p className="font-semibold text-white">{phoneNumber}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                      Verification Code
                    </label>
                    <VerificationCodeInput
                      value={phoneCode}
                      onChange={(code) => {
                        setPhoneCode(code);
                        setErrors({ ...errors, code: "" });
                      }}
                      onComplete={(code) => {
                        if (code.length === 6) {
                          verifyPhoneCode();
                        }
                      }}
                      error={errors.code}
                      disabled={isLoading}
                      length={6}
                    />
                    <p className="mt-3 text-xs text-slate-500 text-center">
                      Enter the 6-digit code from your SMS message
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("phone");
                      setPhoneCode("");
                      codeForm.reset();
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Change Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={verifyPhoneCode}
                    disabled={isLoading || phoneCode.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
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
                  <button
                    type="button"
                    onClick={() => {
                      setCountdown(60);
                      sendPhoneCode(phoneNumber);
                    }}
                    disabled={isLoading || countdown > 0}
                    className="text-sm text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Email Authentication */}
      {authMethod === "email" && (
        <>
          {emailStep === "email-check" && (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <form className="mt-6 space-y-6" onSubmit={emailCheckForm.handleSubmit((data) => {
                checkEmailStatus(data.email);
              })}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      {...emailCheckForm.register("email")}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      style={{ color: '#f1f5f9' }}
                      autoComplete="email"
                    />
                    {emailCheckForm.formState.errors.email && (
                      <p className="mt-2 text-sm text-destructive">{emailCheckForm.formState.errors.email.message}</p>
                    )}
                    {errors.email && (
                      <p className="mt-2 text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-3.5 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {emailStep === "email-login" && (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <form className="mt-6 space-y-6" onSubmit={emailLoginForm.handleSubmit((data) => {
                loginEmail(email, data.password);
              })}>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Email: {email}</p>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...emailLoginForm.register("password")}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                        style={{ color: '#f1f5f9' }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {emailLoginForm.formState.errors.password && (
                      <p className="mt-2 text-sm text-destructive">{emailLoginForm.formState.errors.password.message}</p>
                    )}
                    {errors.password && (
                      <p className="mt-2 text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email-check");
                      setEmail("");
                      setEmailOtpCode("");
                      emailLoginForm.reset();
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Use a different email
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {emailStep === "email-register" && (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <form className="mt-6 space-y-6" onSubmit={emailRegisterForm.handleSubmit((data) => {
                registerEmail(data);
              })}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      {...emailRegisterForm.register("firstName")}
                      placeholder="First Name"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      style={{ color: '#f1f5f9' }}
                      autoComplete="given-name"
                    />
                    {emailRegisterForm.formState.errors.firstName && (
                      <p className="mt-2 text-sm text-destructive">{emailRegisterForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...emailRegisterForm.register("lastName")}
                      placeholder="Last Name"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      style={{ color: '#f1f5f9' }}
                      autoComplete="family-name"
                    />
                    {emailRegisterForm.formState.errors.lastName && (
                      <p className="mt-2 text-sm text-destructive">{emailRegisterForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Email: {email}</p>
                    <input
                      type="email"
                      {...emailRegisterForm.register("email")}
                      value={email}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 text-base font-medium opacity-90 cursor-not-allowed"
                      style={{ color: '#e2e8f0' }}
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...emailRegisterForm.register("password")}
                        placeholder="Password (min 8 characters)"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                        style={{ color: '#f1f5f9' }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {emailRegisterForm.formState.errors.password && (
                      <p className="mt-2 text-sm text-destructive">{emailRegisterForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email-check");
                      setEmail("");
                      setEmailOtpCode("");
                      emailLoginForm.reset();
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Use a different email
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {emailStep === "email-setup-password" && (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <form className="mt-6 space-y-6" onSubmit={emailSetupPasswordForm.handleSubmit((data) => {
                setPassword(data.email, data.password);
              })}>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Email: {email}</p>
                    <input
                      type="email"
                      {...emailSetupPasswordForm.register("email")}
                      value={email}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 text-base font-medium opacity-90 cursor-not-allowed"
                      style={{ color: '#e2e8f0' }}
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...emailSetupPasswordForm.register("password")}
                        placeholder="Password (min 8 characters)"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                        style={{ color: '#f1f5f9' }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {emailSetupPasswordForm.formState.errors.password && (
                      <p className="mt-2 text-sm text-destructive">{emailSetupPasswordForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...emailSetupPasswordForm.register("confirmPassword")}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                        style={{ color: '#f1f5f9' }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {emailSetupPasswordForm.formState.errors.confirmPassword && (
                      <p className="mt-2 text-sm text-destructive">{emailSetupPasswordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email-check");
                      setEmail("");
                      setEmailOtpCode("");
                      emailSetupPasswordForm.reset();
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("phone")}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Switch to Phone Login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                        Setting...
                      </>
                    ) : (
                      "Set Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {emailStep === "email-otp" && (
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="mt-6 space-y-6">
                <div className="text-center bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                    <p className="text-sm font-medium text-emerald-400">Code sent successfully!</p>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">
                    We&apos;ve sent a verification code to:
                  </p>
                  <p className="font-semibold text-white">{email}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                      Verification Code
                    </label>
                    <VerificationCodeInput
                      value={emailOtpCode}
                      onChange={(code) => {
                        setEmailOtpCode(code);
                        setErrors({ ...errors, code: "" });
                      }}
                      onComplete={(code) => {
                        if (code.length === 6) {
                          verifyEmailOtp();
                        }
                      }}
                      error={errors.code}
                      disabled={isLoading}
                      length={6}
                    />
                    <p className="mt-3 text-xs text-slate-500 text-center">
                      Enter the 6-digit code from your email
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email-check");
                      setEmail("");
                      setEmailOtpCode("");
                      emailOtpForm.reset();
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    disabled={isLoading || emailOtpCode.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
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
                  <p className="text-sm text-slate-400">
                    Didn&apos;t receive the code? Go back and sign in again to resend.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <Shield className="text-white w-8 h-8" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <p className="text-slate-400 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
