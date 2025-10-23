"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./input";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  disabled?: boolean;
  length?: number;
}

export function VerificationCodeInput({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  length = 6,
}: VerificationCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update digits when value prop changes
  useEffect(() => {
    if (value !== digits.join("")) {
      const newDigits = value.split("").slice(0, length);
      const paddedDigits = [...newDigits, ...new Array(length - newDigits.length).fill("")];
      setDigits(paddedDigits);
    }
  }, [value, length, digits]);

  // Focus first empty input
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex(digit => digit === "");
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [digits]);

  const handleDigitChange = (index: number, newDigit: string) => {
    // Only allow single digits
    if (newDigit.length > 1) {
      newDigit = newDigit.slice(-1);
    }

    // Only allow numbers
    if (newDigit && !/^\d$/.test(newDigit)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = newDigit;
    setDigits(newDigits);

    const code = newDigits.join("");
    onChange(code);

    // Auto-focus next input
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (code.length === length && !code.includes("")) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);
    
    if (digits.length > 0) {
      const newDigits = [...Array(length).fill("")];
      for (let i = 0; i < digits.length; i++) {
        newDigits[i] = digits[i];
      }
      setDigits(newDigits);
      onChange(newDigits.join(""));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextEmptyIndex]?.focus();
      
      // If code is complete, trigger onComplete
      if (digits.length === length) {
        onComplete?.(newDigits.join(""));
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-center space-x-2">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="w-12 h-12 text-center text-2xl font-mono border-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            maxLength={1}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
