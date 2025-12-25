"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSettingsSchema, type UserSettingsFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UserSettingsFormProps {
  initialData?: Partial<UserSettingsFormData>;
  onSubmit: (data: UserSettingsFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const profileVisibilityOptions = [
  { value: "public", label: "Public" },
  { value: "contacts_only", label: "Contacts Only" },
  { value: "private", label: "Private" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
  { value: "es", label: "Spanish" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

const dateFormatOptions = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const timeFormatOptions = [
  { value: "12h", label: "12 Hour" },
  { value: "24h", label: "24 Hour" },
];

const currencyOptions = [
  { value: "PHP", label: "Philippine Peso (PHP)" },
];

export function UserSettingsForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: UserSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      privacy: initialData?.privacy || {
        profileVisibility: "public",
        showPhoneNumber: true,
        showEmail: true,
        showLocation: true,
        showRating: true,
        showPortfolio: true,
        allowDirectMessages: true,
        allowJobInvitations: true,
        allowReferralRequests: true,
      },
      notifications: initialData?.notifications || {
        push: {
          enabled: true,
          newMessages: true,
          jobMatches: true,
          bookingUpdates: true,
          paymentUpdates: true,
          referralUpdates: true,
          systemUpdates: true,
          marketing: false,
        },
        email: {
          enabled: true,
          newMessages: true,
          jobMatches: true,
          bookingUpdates: true,
          paymentUpdates: true,
          referralUpdates: true,
          systemUpdates: true,
          marketing: false,
          weeklyDigest: true,
          monthlyReport: true,
        },
        sms: {
          enabled: false,
          urgentMessages: true,
          bookingReminders: true,
          paymentAlerts: true,
          securityAlerts: true,
        },
      },
      communication: initialData?.communication || {
        preferredLanguage: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
        currency: "PHP",
      },
    },
  });

  const onSubmitForm = async (data: UserSettingsFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Profile Visibility *</label>
            <Select
              {...register("privacy.profileVisibility")}
              options={profileVisibilityOptions}
            />
            {errors.privacy?.profileVisibility && (
              <p className="text-red-600 text-sm mt-1">{errors.privacy.profileVisibility.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.showPhoneNumber")}
                className="rounded"
              />
              <span className="text-sm">Show Phone Number</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.showEmail")}
                className="rounded"
              />
              <span className="text-sm">Show Email</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.showLocation")}
                className="rounded"
              />
              <span className="text-sm">Show Location</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.showRating")}
                className="rounded"
              />
              <span className="text-sm">Show Rating</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.showPortfolio")}
                className="rounded"
              />
              <span className="text-sm">Show Portfolio</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.allowDirectMessages")}
                className="rounded"
              />
              <span className="text-sm">Allow Direct Messages</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.allowJobInvitations")}
                className="rounded"
              />
              <span className="text-sm">Allow Job Invitations</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("privacy.allowReferralRequests")}
                className="rounded"
              />
              <span className="text-sm">Allow Referral Requests</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Push Notifications</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("notifications.push.enabled")}
                  className="rounded"
                />
                <span className="text-sm">Enable Push Notifications</span>
              </label>
              <div className="ml-6 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.newMessages")}
                    className="rounded"
                  />
                  <span className="text-sm">New Messages</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.jobMatches")}
                    className="rounded"
                  />
                  <span className="text-sm">Job Matches</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.bookingUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Booking Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.paymentUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Payment Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.referralUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Referral Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.systemUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">System Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.push.marketing")}
                    className="rounded"
                  />
                  <span className="text-sm">Marketing</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Email Notifications</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("notifications.email.enabled")}
                  className="rounded"
                />
                <span className="text-sm">Enable Email Notifications</span>
              </label>
              <div className="ml-6 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.newMessages")}
                    className="rounded"
                  />
                  <span className="text-sm">New Messages</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.jobMatches")}
                    className="rounded"
                  />
                  <span className="text-sm">Job Matches</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.bookingUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Booking Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.paymentUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Payment Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.referralUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">Referral Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.systemUpdates")}
                    className="rounded"
                  />
                  <span className="text-sm">System Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.marketing")}
                    className="rounded"
                  />
                  <span className="text-sm">Marketing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.weeklyDigest")}
                    className="rounded"
                  />
                  <span className="text-sm">Weekly Digest</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.email.monthlyReport")}
                    className="rounded"
                  />
                  <span className="text-sm">Monthly Report</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">SMS Notifications</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("notifications.sms.enabled")}
                  className="rounded"
                />
                <span className="text-sm">Enable SMS Notifications</span>
              </label>
              <div className="ml-6 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.sms.urgentMessages")}
                    className="rounded"
                  />
                  <span className="text-sm">Urgent Messages</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.sms.bookingReminders")}
                    className="rounded"
                  />
                  <span className="text-sm">Booking Reminders</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.sms.paymentAlerts")}
                    className="rounded"
                  />
                  <span className="text-sm">Payment Alerts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("notifications.sms.securityAlerts")}
                    className="rounded"
                  />
                  <span className="text-sm">Security Alerts</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Communication Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Language *</label>
            <Select
              {...register("communication.preferredLanguage")}
              options={languageOptions}
            />
            {errors.communication?.preferredLanguage && (
              <p className="text-red-600 text-sm mt-1">{errors.communication.preferredLanguage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone *</label>
            <Input
              {...register("communication.timezone")}
              placeholder="America/New_York"
            />
            {errors.communication?.timezone && (
              <p className="text-red-600 text-sm mt-1">{errors.communication.timezone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Format *</label>
              <Select
                {...register("communication.dateFormat")}
                options={dateFormatOptions}
              />
              {errors.communication?.dateFormat && (
                <p className="text-red-600 text-sm mt-1">{errors.communication.dateFormat.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Format *</label>
              <Select
                {...register("communication.timeFormat")}
                options={timeFormatOptions}
              />
              {errors.communication?.timeFormat && (
                <p className="text-red-600 text-sm mt-1">{errors.communication.timeFormat.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency *</label>
            <Select
              {...register("communication.currency")}
              options={currencyOptions}
            />
            {errors.communication?.currency && (
              <p className="text-red-600 text-sm mt-1">{errors.communication.currency.message}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

