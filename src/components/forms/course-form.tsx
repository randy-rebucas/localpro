"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface CourseFormProps {
  initialData?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const categories = [
  { value: "cleaning", label: "Cleaning" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "moving", label: "Moving" },
  { value: "business", label: "Business" },
  { value: "safety", label: "Safety" },
  { value: "certification", label: "Certification" },
];

const levels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export function CourseForm({ initialData, onSubmit, onCancel, loading = false }: CourseFormProps) {
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(initialData?.learningOutcomes || []);
  const [newOutcome, setNewOutcome] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "cleaning",
      level: initialData?.level || "beginner",
      duration: initialData?.duration || {
        hours: 1,
      },
      pricing: initialData?.pricing || {
        regularPrice: 0,
        currency: "PHP",
      },
      learningOutcomes: initialData?.learningOutcomes || [],
    },
  });

  const addOutcome = () => {
    if (newOutcome.trim()) {
      const updated = [...learningOutcomes, newOutcome.trim()];
      setLearningOutcomes(updated);
      setValue("learningOutcomes", updated);
      setNewOutcome("");
    }
  };

  const removeOutcome = (index: number) => {
    const updated = learningOutcomes.filter((_, i) => i !== index);
    setLearningOutcomes(updated);
    setValue("learningOutcomes", updated);
  };

  const onSubmitForm = async (data: CourseFormData) => {
    await onSubmit({
      ...data,
      learningOutcomes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Course Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter course title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe the course"
              rows={6}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select
                {...register("category")}
                options={categories}
              />
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Level *</label>
              <Select
                {...register("level")}
                options={levels}
              />
              {errors.level && <p className="text-red-600 text-sm mt-1">{errors.level.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Duration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hours *</label>
            <Input
              type="number"
              {...register("duration.hours", { valueAsNumber: true })}
              placeholder="1"
              min={1}
            />
            {errors.duration?.hours && <p className="text-red-600 text-sm mt-1">{errors.duration.hours.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weeks (optional)</label>
            <Input
              type="number"
              {...register("duration.weeks", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Regular Price *</label>
            <Input
              type="number"
              {...register("pricing.regularPrice", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
            {errors.pricing?.regularPrice && <p className="text-red-600 text-sm mt-1">{errors.pricing.regularPrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Discounted Price</label>
            <Input
              type="number"
              {...register("pricing.discountedPrice", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <Input
              {...register("pricing.currency")}
              placeholder="PHP"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Outcomes *</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              placeholder="Enter a learning outcome"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOutcome();
                }
              }}
            />
            <Button type="button" onClick={addOutcome}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {learningOutcomes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {learningOutcomes.map((outcome, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {outcome}
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    className="hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.learningOutcomes && <p className="text-red-600 text-sm mt-1">{errors.learningOutcomes.message}</p>}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Course" : "Create Course"}
        </Button>
      </div>
    </form>
  );
}

