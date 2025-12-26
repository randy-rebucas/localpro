"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import { getBusinessInfo, getSupportChannels, isSupportChannelEnabled, isBusinessOpen } from "@/lib/settings-utils";
import { Mail, Phone, MessageCircle, Clock, MapPin } from "lucide-react";

interface BusinessInfoProps {
  showSupportChannels?: boolean;
  showBusinessHours?: boolean;
  showAddress?: boolean;
  className?: string;
}

export function BusinessInfo({
  showSupportChannels = true,
  showBusinessHours = true,
  showAddress = true,
  className = "",
}: BusinessInfoProps) {
  const { settings: appSettings } = useAppSettings();
  const businessInfo = getBusinessInfo(appSettings);
  const supportChannels = getSupportChannels(appSettings);
  const businessHours = appSettings?.business?.businessHours;
  const isOpen = isBusinessOpen(appSettings);

  if (!businessInfo) {
    return null;
  }

  return (
    <div className={className}>
      {/* Company Information */}
      {(businessInfo.companyName || businessInfo.companyEmail || businessInfo.companyPhone) && (
        <div className="space-y-2 mb-6">
          {businessInfo.companyName && (
            <h3 className="text-lg font-semibold text-gray-900">{businessInfo.companyName}</h3>
          )}
          <div className="space-y-1 text-sm text-gray-600">
            {businessInfo.companyEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${businessInfo.companyEmail}`} className="hover:text-primary">
                  {businessInfo.companyEmail}
                </a>
              </div>
            )}
            {businessInfo.companyPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${businessInfo.companyPhone}`} className="hover:text-primary">
                  {businessInfo.companyPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address */}
      {showAddress && businessInfo.companyAddress && (
        <div className="mb-6">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              {businessInfo.companyAddress.street && <div>{businessInfo.companyAddress.street}</div>}
              {(businessInfo.companyAddress.city || businessInfo.companyAddress.state) && (
                <div>
                  {businessInfo.companyAddress.city}
                  {businessInfo.companyAddress.city && businessInfo.companyAddress.state && ", "}
                  {businessInfo.companyAddress.state}
                </div>
              )}
              {businessInfo.companyAddress.zipCode && <div>{businessInfo.companyAddress.zipCode}</div>}
              {businessInfo.companyAddress.country && <div>{businessInfo.companyAddress.country}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Business Hours */}
      {showBusinessHours && businessHours?.schedule && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-900">Business Hours</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isOpen ? "bg-accent/10 text-accent" : "bg-red-100 text-red-800"
            }`}>
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            {businessHours.schedule.map((schedule, index) => (
              <div key={index} className="flex justify-between">
                <span className="capitalize">{schedule.day}</span>
                <span>
                  {schedule.isOpen
                    ? `${schedule.startTime || "N/A"} - ${schedule.endTime || "N/A"}`
                    : "Closed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Channels */}
      {showSupportChannels && supportChannels && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Support Channels</h4>
          <div className="space-y-2">
            {isSupportChannelEnabled("email", appSettings) && supportChannels.email?.address && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <a href={`mailto:${supportChannels.email.address}`} className="text-primary hover:underline">
                  {supportChannels.email.address}
                </a>
              </div>
            )}
            {isSupportChannelEnabled("phone", appSettings) && supportChannels.phone?.number && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <a href={`tel:${supportChannels.phone.number}`} className="text-primary hover:underline">
                  {supportChannels.phone.number}
                </a>
              </div>
            )}
            {isSupportChannelEnabled("chat", appSettings) && (
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Live Chat
                  {supportChannels.chat?.hours && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({supportChannels.chat.hours.start} - {supportChannels.chat.hours.end})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

