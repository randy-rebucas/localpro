"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, type JobFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSubmit: (data: JobFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const jobTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

const companySizes = [
  { value: "startup", label: "Startup" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "enterprise", label: "Enterprise" },
];

export function JobForm({ initialData, onSubmit, onCancel, loading = false }: JobFormProps) {
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements || []);
  const [newSkill, setNewSkill] = useState("");
  const [newRequirement, setNewRequirement] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      company: initialData?.company || {
        name: "",
      },
      category: initialData?.category || "",
      subcategory: initialData?.subcategory || "",
      jobType: initialData?.jobType || "full_time",
      experienceLevel: initialData?.experienceLevel || "mid",
      salary: initialData?.salary,
      isRemote: initialData?.isRemote || false,
      skills: initialData?.skills || [],
      requirements: initialData?.requirements || [],
    },
  });

  const addSkill = () => {
    if (newSkill.trim()) {
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      setValue("skills", updated);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    setValue("skills", updated);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const updated = [...requirements, newRequirement.trim()];
      setRequirements(updated);
      setValue("requirements", updated);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    setValue("requirements", updated);
  };

  const onSubmitForm = async (data: JobFormData) => {
    await onSubmit({
      ...data,
      skills,
      requirements,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Job Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter job title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe the job position"
              rows={6}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Input
                {...register("category")}
                placeholder="Enter category"
              />
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subcategory *</label>
              <Input
                {...register("subcategory")}
                placeholder="Enter subcategory"
              />
              {errors.subcategory && <p className="text-red-600 text-sm mt-1">{errors.subcategory.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Type *</label>
              <Select
                {...register("jobType")}
                options={jobTypes}
              />
              {errors.jobType && <p className="text-red-600 text-sm mt-1">{errors.jobType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Experience Level *</label>
              <Select
                {...register("experienceLevel")}
                options={experienceLevels}
              />
              {errors.experienceLevel && <p className="text-red-600 text-sm mt-1">{errors.experienceLevel.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <Input
              {...register("company.name")}
              placeholder="Enter company name"
            />
            {errors.company?.name && <p className="text-red-600 text-sm mt-1">{errors.company.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Website</label>
              <Input
                type="url"
                {...register("company.website")}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Size</label>
              <Select
                {...register("company.size")}
                options={companySizes}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <Input
              {...register("company.industry")}
              placeholder="Enter industry"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Salary Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Min Salary</label>
            <Input
              type="number"
              {...register("salary.min", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Salary</label>
            <Input
              type="number"
              {...register("salary.max", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Period</label>
            <Select
              {...register("salary.period")}
              options={[
                { value: "hourly", label: "Hourly" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isRemote")}
              className="rounded"
            />
            <span className="text-sm">Remote Position</span>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Required Skills *</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Enter a skill"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button type="button" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.skills && <p className="text-red-600 text-sm mt-1">{errors.skills.message}</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Requirements</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Enter a requirement"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRequirement();
                }
              }}
            />
            <Button type="button" onClick={addRequirement}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirements.map((requirement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  {requirement}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="hover:text-orange-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Job" : "Post Job"}
        </Button>
      </div>
    </form>
  );
}

