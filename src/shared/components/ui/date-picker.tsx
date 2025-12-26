"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Input } from "./input";

interface DatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  className = "",
  showTime = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? (typeof value === "string" ? new Date(value) : value) : null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    if (showTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  const handleDateSelect = (date: Date) => {
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    setSelectedDate(date);
    onChange?.(date);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={formatDate(selectedDate)}
          placeholder={placeholder}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="cursor-pointer pr-10"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 hover:bg-accent rounded"
            >
              ←
            </button>
            <h3 className="font-semibold">
              {new Date(year, month).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 hover:bg-accent rounded"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => {
                    const date = new Date(year, month, day);
                    handleDateSelect(date);
                  }}
                  disabled={disabled}
                  className={`
                    aspect-square rounded hover:bg-muted transition-colors
                    ${disabled ? "text-muted-foreground/40 cursor-not-allowed" : "cursor-pointer"}
                    ${selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    ${today && !selected ? "border-2 border-primary" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {showTime && selectedDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-sm font-medium mb-2 text-foreground">Time</label>
              <Input
                type="time"
                value={
                  selectedDate
                    ? `${String(selectedDate.getHours()).padStart(2, "0")}:${String(
                        selectedDate.getMinutes()
                      ).padStart(2, "0")}`
                    : ""
                }
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":").map(Number);
                  if (selectedDate) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setSelectedDate(newDate);
                    onChange?.(newDate);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

