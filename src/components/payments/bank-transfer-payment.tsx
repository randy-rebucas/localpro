"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, CreditCard, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/currency-utils";
import { logger } from "@/lib/logger";

interface BankTransferPaymentProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (transactionId: string, details: BankTransferDetails) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  referenceNumber: string;
  transferDate: string;
  notes?: string;
}

const BANK_OPTIONS = [
  { value: "bpi", label: "BPI (Bank of the Philippine Islands)" },
  { value: "bdo", label: "BDO (Banco de Oro)" },
  { value: "metrobank", label: "Metrobank" },
  { value: "unionbank", label: "UnionBank" },
  { value: "landbank", label: "Land Bank of the Philippines" },
  { value: "pnb", label: "PNB (Philippine National Bank)" },
  { value: "security_bank", label: "Security Bank" },
  { value: "rcbc", label: "RCBC (Rizal Commercial Banking Corporation)" },
  { value: "eastwest", label: "EastWest Bank" },
  { value: "other", label: "Other Bank" }
];

const COMPANY_BANK_DETAILS = {
  bankName: "BDO (Banco de Oro)",
  accountName: "LocalPro Super App Inc.",
  accountNumber: "1234-5678-9012",
  swiftCode: "BNORPHMM"
};

export function BankTransferPayment({
  amount,
  currency = "PHP",
  description = "Payment",
  onSuccess,
  onError,
  disabled = false
}: BankTransferPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    referenceNumber: "",
    transferDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const { showToast } = useToast();

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`${fieldName} copied to clipboard`, "success");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      showToast("Unable to copy to clipboard", "error");
    }
  };

  const validateForm = (): boolean => {
    if (!formData.bankName) {
      showToast("Please select your bank", "error");
      return false;
    }

    if (!formData.accountName.trim()) {
      showToast("Please enter your account name", "error");
      return false;
    }

    if (!formData.accountNumber.trim()) {
      showToast("Please enter your account number", "error");
      return false;
    }

    if (!formData.referenceNumber.trim()) {
      showToast("Please enter the bank reference number", "error");
      return false;
    }

    return true;
  };

  const handleSubmitTransfer = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const transactionId = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setIsProcessing(false);
      showToast("Your bank transfer details have been submitted for verification", "success");

      logger.info("Bank transfer details submitted", {
        transactionId,
        amount,
        currency,
        bankDetails: formData
      });

      onSuccess(transactionId, formData);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (disabled) {
    return (
      <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-500">Bank Transfer</p>
            <p className="text-sm text-gray-400">Currently unavailable</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-green-200 bg-green-50/50">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
          <p className="text-sm text-gray-600">Transfer directly from your bank account</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Bank Details */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Transfer to these details:</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bank:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{COMPANY_BANK_DETAILS.bankName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToClipboard(COMPANY_BANK_DETAILS.bankName, "Bank name")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Bank name" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Account Name:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{COMPANY_BANK_DETAILS.accountName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToClipboard(COMPANY_BANK_DETAILS.accountName, "Account name")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Account name" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Account Number:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium text-gray-900">{COMPANY_BANK_DETAILS.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToClipboard(COMPANY_BANK_DETAILS.accountNumber, "Account number")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Account number" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(amount, currency)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToClipboard(amount.toString(), "Amount")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Amount" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Details Form */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Enter your transfer details:</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-select">Your Bank</Label>
              <Select
                id="bank-select"
                value={formData.bankName}
                onValueChange={(value) => handleInputChange("bankName", value)}
              >
                <option value="">Select your bank</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.value} value={bank.label}>
                    {bank.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="Enter account holder name"
                value={formData.accountName}
                onChange={(e) => handleInputChange("accountName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter your account number"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-number">Reference/Transaction Number</Label>
              <Input
                id="reference-number"
                placeholder="Enter bank reference number"
                value={formData.referenceNumber}
                onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-date">Transfer Date</Label>
            <Input
              id="transfer-date"
              type="date"
              value={formData.transferDate}
              onChange={(e) => handleInputChange("transferDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about the transfer..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmitTransfer}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting Transfer Details...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Submit Transfer Details
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Please ensure the exact amount is transferred. Processing may take 1-3 business days.
        </p>
      </div>
    </Card>
  );
}
