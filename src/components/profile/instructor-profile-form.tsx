"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Save, Loader2, Plus, X, Award, BookOpen, Clock, Globe, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const instructorProfileSchema = z.object({
  // Basic Information
  instructorName: z.string().min(1, "Instructor name is required"),
  bio: z.string().optional(),
  
  // Specialties
  specialties: z.array(z.string()).optional(),
  
  // Certifications
  certifications: z.array(z.object({
    name: z.string().min(1, "Certification name is required"),
    issuer: z.string().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    certificateNumber: z.string().optional(),
  })).optional(),
  
  // Education
  education: z.array(z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    year: z.number().optional(),
    field: z.string().optional(),
  })).optional(),
  
  // Experience
  teachingExperience: z.number().min(0).optional(),
  totalStudents: z.number().min(0).optional(),
  totalCourses: z.number().min(0).optional(),
  
  // Languages
  languages: z.array(z.string()).optional(),
  
  // Availability
  availability: z.object({
    schedule: z.string().optional(),
    timezone: z.string().optional(),
    hoursPerWeek: z.number().optional(),
  }).optional(),
  
  // Course Categories
  courseCategories: z.array(z.string()).optional(),
  
  // Pricing
  pricing: z.object({
    hourlyRate: z.number().min(0).optional(),
    courseRate: z.number().min(0).optional(),
    consultationRate: z.number().min(0).optional(),
    currency: z.string().optional(),
  }).optional(),
  
  // Contact Information
  contactInfo: z.object({
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    socialMedia: z.object({
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
    }).optional(),
  }).optional(),
});

type InstructorProfileForm = z.infer<typeof instructorProfileSchema>;

interface InstructorProfileFormProps {
  initialData?: Partial<InstructorProfileForm>;
  onSave?: () => void;
}

export function InstructorProfileForm({ initialData, onSave }: InstructorProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<InstructorProfileForm>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: initialData || {
      instructorName: "",
      bio: "",
      specialties: [],
      certifications: [],
      education: [],
      teachingExperience: 0,
      totalStudents: 0,
      totalCourses: 0,
      languages: [],
      availability: {
        schedule: "",
        timezone: "",
        hoursPerWeek: 0,
      },
      courseCategories: [],
      pricing: {
        hourlyRate: 0,
        courseRate: 0,
        consultationRate: 0,
        currency: "USD",
      },
      contactInfo: {
        email: "",
        phone: "",
        website: "",
        socialMedia: {},
      },
    },
  });

  const { fields: specialtyFields, append: addSpecialty, remove: removeSpecialty } = useFieldArray({
    control,
    name: 'specialties' as never,
  });

  const { fields: certificationFields, append: addCertification, remove: removeCertification } = useFieldArray({
    control,
    name: 'certifications',
  });

  const { fields: educationFields, append: addEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education',
  });

  const { fields: languageFields, append: addLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages' as never,
  });

  const { fields: categoryFields, append: addCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'courseCategories' as never,
  });

  // Fetch instructor profile if exists
  useEffect(() => {
    const fetchInstructorProfile = async () => {
      try {
        setLoading(true);
        // TODO: Implement API endpoint to fetch instructor profile
        // const response = await fetch(`${API_BASE_URL}/api/instructors/profile/me`, createAuthFetchOptions());
        // if (response.ok) {
        //   const data = await response.json();
        //   // Set form values
        // }
      } catch (error) {
        logger.error('Failed to fetch instructor profile', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    fetchInstructorProfile();
  }, []);

  // Transform form data to API format (for course - instructor info might be part of course)
  // Note: This form collects instructor profile info, but API docs show PATCH for courses
  // This might need adjustment based on actual API structure
  const transformFormDataToAPI = (data: InstructorProfileForm): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    
    // Map instructor info - this might be used when creating/updating courses
    // or might need a separate instructor profile endpoint
    if (data.instructorName) {
      // Instructor name might be part of course metadata
      payload.title = data.instructorName; // Placeholder - adjust based on API
    }
    
    if (data.bio) payload.description = data.bio;
    
    if (data.specialties && data.specialties.length > 0) {
      payload.tags = data.specialties;
    }
    
    if (data.courseCategories && data.courseCategories.length > 0) {
      // This might map to course category
      payload.category = data.courseCategories[0];
    }
    
    if (data.pricing) {
      payload.pricing = {
        regularPrice: data.pricing.courseRate || data.pricing.hourlyRate || undefined,
        currency: data.pricing.currency || 'USD',
      };
      // Remove undefined fields
      const pricing = payload.pricing as Record<string, unknown>;
      if (pricing && typeof pricing === 'object') {
        Object.keys(pricing).forEach(key => {
          if (pricing[key] === undefined) {
            delete pricing[key];
          }
        });
        if (Object.keys(pricing).length === 0) {
          delete payload.pricing;
        }
      }
    }
    
    // Remove undefined top-level fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    return payload;
  };

  const onSubmit = async (data: InstructorProfileForm) => {
    try {
      setSaving(true);
      
      // Transform form data to API format
      const apiPayload = transformFormDataToAPI(data);
      
      // If no data to update, skip
      if (Object.keys(apiPayload).length === 0) {
        toast.error('No changes to save');
        return;
      }
      
      // Note: The API docs show PATCH for courses, not instructor profiles
      // This might need to use a different endpoint or be part of course creation
      // For now, using a placeholder endpoint structure
      let response;
      
      if (courseId) {
        // Update existing course using PATCH (if instructor info is part of course)
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.academyCoursesById}/${courseId}`,
          {
            ...createAuthFetchOptions({
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(apiPayload),
            }),
          }
        );
      } else {
        // TODO: Instructor profile might need a separate endpoint
        // For now, using a placeholder - this might need to be POST to create instructor profile
        // or might be part of user profile update
        toast.error('Instructor profile endpoint not yet implemented. Please create a course first.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save instructor profile');
      }

      toast.success('Instructor profile saved successfully!');
      onSave?.();
    } catch (error) {
      logger.error('Failed to save instructor profile', error instanceof Error ? error : new Error(String(error)));
      toast.error(error instanceof Error ? error.message : 'Failed to save instructor profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900">Instructor Profile Information</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Basic Information
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructor Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('instructorName')}
              placeholder="Enter your name"
            />
            {errors.instructorName && (
              <p className="mt-1 text-sm text-red-600">{errors.instructorName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <Textarea
              {...register('bio')}
              rows={4}
              placeholder="Tell us about your teaching experience and expertise..."
            />
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Specialties
          </h4>
          <div className="space-y-2">
            {specialtyFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`specialties.${index}`)}
                  placeholder="Enter specialty"
                />
                {specialtyFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecialty(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSpecialty('')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
            >
              <Plus className="w-4 h-4" />
              Add Specialty
            </button>
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </h4>
          {certificationFields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Certification {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register(`certifications.${index}.name`)}
                    placeholder="Certification name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issuer</label>
                  <Input
                    {...register(`certifications.${index}.issuer`)}
                    placeholder="Issuing organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                  <Input
                    {...register(`certifications.${index}.issueDate`)}
                    type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <Input
                    {...register(`certifications.${index}.expiryDate`)}
                    type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Number</label>
                  <Input
                    {...register(`certifications.${index}.certificateNumber`)}
                    placeholder="Certificate number"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addCertification({ name: '', issuer: '', issueDate: '', expiryDate: '', certificateNumber: '' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </button>
        </div>

        {/* Education */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </h4>
          {educationFields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Education {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <Input
                    {...register(`education.${index}.degree`)}
                    placeholder="e.g., Bachelor's, Master's, PhD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <Input
                    {...register(`education.${index}.institution`)}
                    placeholder="University or institution name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <Input
                    {...register(`education.${index}.field`)}
                    placeholder="Field of study"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <Input
                    {...register(`education.${index}.year`, { valueAsNumber: true })}
                    type="number"
                    placeholder="YYYY"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addEducation({ degree: '', institution: '', year: undefined, field: '' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>

        {/* Experience & Statistics */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Experience & Statistics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Experience (years)</label>
              <Input
                {...register('teachingExperience', { valueAsNumber: true })}
                type="number"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Students</label>
              <Input
                {...register('totalStudents', { valueAsNumber: true })}
                type="number"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Courses</label>
              <Input
                {...register('totalCourses', { valueAsNumber: true })}
                type="number"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Languages
          </h4>
          <div className="space-y-2">
            {languageFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`languages.${index}`)}
                  placeholder="Language"
                />
                {languageFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addLanguage('')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Availability
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
              <Input
                {...register('availability.schedule')}
                placeholder="e.g., Monday-Friday, 9am-5pm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <Input
                {...register('availability.timezone')}
                placeholder="e.g., EST, PST"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours Per Week</label>
              <Input
                {...register('availability.hoursPerWeek', { valueAsNumber: true })}
                type="number"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Course Categories */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Categories
          </h4>
          <div className="space-y-2">
            {categoryFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`courseCategories.${index}`)}
                  placeholder="Category name"
                />
                {categoryFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addCategory('')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
              <Input
                {...register('pricing.hourlyRate', { valueAsNumber: true })}
                type="number"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Rate</label>
              <Input
                {...register('pricing.courseRate', { valueAsNumber: true })}
                type="number"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Rate</label>
              <Input
                {...register('pricing.consultationRate', { valueAsNumber: true })}
                type="number"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                {...register('pricing.currency')}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                {...register('contactInfo.email')}
                type="email"
                placeholder="instructor@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <Input
                {...register('contactInfo.phone')}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <Input
                {...register('contactInfo.website')}
                type="url"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
