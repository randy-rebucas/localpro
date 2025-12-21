"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/currency-utils";
import { logger } from "@/lib/logger";

interface PayMayaPaymentProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function PayMayaPayment({
  amount,
  currency = "PHP",
  description = "Payment",
  onSuccess,
  onError,
  disabled = false
}: PayMayaPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"phone" | "confirm">("phone");
  const { showToast } = useToast();

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast("Please enter a valid PayMaya-registered phone number", "error");
      return;
    }

    setIsProcessing(true);
    setStep("confirm");

    // Simulate API call delay
    setTimeout(() => {
      setIsProcessing(false);
      showToast(`A payment request for ${formatCurrency(amount, currency)} has been sent to ${phoneNumber}`, "success");
    }, 2000);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const transactionId = `PAYMAYA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setIsProcessing(false);
      showToast(`Payment of ${formatCurrency(amount, currency)} completed successfully`, "success");

      logger.info("PayMaya payment completed", { transactionId, amount, currency });
      onSuccess(transactionId);
    }, 3000);
  };

  const handleCancel = () => {
    setStep("phone");
    setPhoneNumber("");
  };

  if (disabled) {
    return (
      <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-500">PayMaya</p>
            <p className="text-sm text-gray-400">Currently unavailable</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">PayMaya</h3>
          <p className="text-sm text-gray-600">Pay with your PayMaya wallet</p>
        </div>
      </div>

      {step === "phone" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(amount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Description</span>
              <span className="text-sm text-gray-600">{description}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymaya-phone">PayMaya Phone Number</Label>
            <Input
              id="paymaya-phone"
              type="tel"
              placeholder="Enter your PayMaya phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-left"
            />
            <p className="text-xs text-gray-500">
              Enter the phone number linked to your PayMaya account
            </p>
          </div>

          <Button
            onClick={handlePhoneSubmit}
            disabled={isProcessing || !phoneNumber}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Request...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Payment Request Sent</span>
            </div>
            <p className="text-sm text-green-700">
              Check your PayMaya app and approve the payment for {formatCurrency(amount, currency)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Amount:</span>
                <span className="font-medium text-blue-900">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Phone:</span>
                <span className="font-medium text-blue-900">{phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Status:</span>
                <span className="font-medium text-green-600">Pending Approval</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
