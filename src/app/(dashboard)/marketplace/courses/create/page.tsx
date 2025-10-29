"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    handleClientApiRoute,
    isAuthenticated 
} from "@/lib/client-api-utils";
import {
    ArrowLeft,
    Save,
    Eye,
    X,
    AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface CourseFormData {
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    subcategory: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    currency: string;
    language: string;
    tags: string[];
    prerequisites: string[];
    learningOutcomes: string[];
    whatYouWillLearn: string[];
}

export default function CreateCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CourseFormData>({
        title: '',
        description: '',
        shortDescription: '',
        category: '',
        subcategory: '',
        level: 'beginner',
        price: 0,
        currency: 'USD',
        language: 'en',
        tags: [],
        prerequisites: [],
        learningOutcomes: [],
        whatYouWillLearn: []
    });
    const [newTag, setNewTag] = useState('');
    const [newPrerequisite, setNewPrerequisite] = useState('');
    const [newLearningOutcome, setNewLearningOutcome] = useState('');
    const [newWhatYouWillLearn, setNewWhatYouWillLearn] = useState('');

    const categories = [
        { value: '', label: 'Select Category' },
        { value: 'programming', label: 'Programming' },
        { value: 'design', label: 'Design' },
        { value: 'business', label: 'Business' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'photography', label: 'Photography' },
        { value: 'music', label: 'Music' },
        { value: 'languages', label: 'Languages' },
        { value: 'other', label: 'Other' }
    ];

    const levels = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    const currencies = [
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'CAD', label: 'CAD (C$)' },
        { value: 'AUD', label: 'AUD (A$)' }
    ];

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'it', label: 'Italian' },
        { value: 'ja', label: 'Japanese' },
        { value: 'ko', label: 'Korean' },
        { value: 'zh', label: 'Chinese' }
    ];

    const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    const addPrerequisite = () => {
        if (newPrerequisite.trim() && !formData.prerequisites.includes(newPrerequisite.trim())) {
            setFormData(prev => ({ ...prev, prerequisites: [...prev.prerequisites, newPrerequisite.trim()] }));
            setNewPrerequisite('');
        }
    };

    const removePrerequisite = (prerequisiteToRemove: string) => {
        setFormData(prev => ({ ...prev, prerequisites: prev.prerequisites.filter(prereq => prereq !== prerequisiteToRemove) }));
    };

    const addLearningOutcome = () => {
        if (newLearningOutcome.trim() && !formData.learningOutcomes.includes(newLearningOutcome.trim())) {
            setFormData(prev => ({ ...prev, learningOutcomes: [...prev.learningOutcomes, newLearningOutcome.trim()] }));
            setNewLearningOutcome('');
        }
    };

    const removeLearningOutcome = (outcomeToRemove: string) => {
        setFormData(prev => ({ ...prev, learningOutcomes: prev.learningOutcomes.filter(outcome => outcome !== outcomeToRemove) }));
    };

    const addWhatYouWillLearn = () => {
        if (newWhatYouWillLearn.trim() && !formData.whatYouWillLearn.includes(newWhatYouWillLearn.trim())) {
            setFormData(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, newWhatYouWillLearn.trim()] }));
            setNewWhatYouWillLearn('');
        }
    };

    const removeWhatYouWillLearn = (itemToRemove: string) => {
        setFormData(prev => ({ ...prev, whatYouWillLearn: prev.whatYouWillLearn.filter(item => item !== itemToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!isAuthenticated()) {
                throw new Error("Authentication required. Please log in to create courses.");
            }

            const result = await handleClientApiRoute(async () => {
                const response = await fetch('/api/academy/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to create course: ${response.status}`);
                }
                
                return await response.json();
            }, "Create course");

            if (result.error) {
                throw new Error(result.error);
            }

            const data = result.data;
            if (data.success && data.data) {
                router.push(`/marketplace/courses/${data.data._id}`);
            } else {
                throw new Error('Failed to create course');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            setError(error instanceof Error ? error.message : 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <PageHeader
                title="Create New Course"
                subtitle="Share your knowledge and help others learn"
                actions={[
                    {
                        type: "link",
                        href: "/marketplace/courses",
                        label: "Back to Courses",
                        icon: ArrowLeft,
                        variant: "outline"
                    }
                ]}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Course Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter course title"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Short Description *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shortDescription}
                                            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Brief description (max 160 characters)"
                                            maxLength={160}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formData.shortDescription.length}/160 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Description *
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={6}
                                            placeholder="Detailed course description"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Course Details */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Course Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            {categories.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Level *
                                        </label>
                                        <select
                                            value={formData.level}
                                            onChange={(e) => handleInputChange('level', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            {levels.map(level => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language *
                                        </label>
                                        <select
                                            value={formData.language}
                                            onChange={(e) => handleInputChange('language', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            {languages.map(lang => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subcategory
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subcategory}
                                            onChange={(e) => handleInputChange('subcategory', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., React, Photoshop, Digital Marketing"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Pricing */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Pricing</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price *
                                        </label>
                                        <div className="flex">
                                            <select
                                                value={formData.currency}
                                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {currencies.map(currency => (
                                                    <option key={currency.value} value={currency.value}>
                                                        {currency.value}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Set to 0 for free courses
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Add a tag"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-blue-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Learning Outcomes */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Learning Outcomes</h2>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newLearningOutcome}
                                            onChange={(e) => setNewLearningOutcome(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningOutcome())}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What will students achieve after completing this course?"
                                        />
                                        <button
                                            type="button"
                                            onClick={addLearningOutcome}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.learningOutcomes.map((outcome, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <span className="text-sm">{outcome}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLearningOutcome(outcome)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* What You'll Learn */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">What You&apos;ll Learn</h2>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newWhatYouWillLearn}
                                            onChange={(e) => setNewWhatYouWillLearn(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWhatYouWillLearn())}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What specific skills or knowledge will students gain?"
                                        />
                                        <button
                                            type="button"
                                            onClick={addWhatYouWillLearn}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.whatYouWillLearn.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <span className="text-sm">{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWhatYouWillLearn(item)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Prerequisites */}
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newPrerequisite}
                                            onChange={(e) => setNewPrerequisite(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What should students know before taking this course?"
                                        />
                                        <button
                                            type="button"
                                            onClick={addPrerequisite}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.prerequisites.map((prerequisite, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <span className="text-sm">{prerequisite}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePrerequisite(prerequisite)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Course Preview */}
                        <Card>
                            <div className="p-6">
                                <h3 className="font-semibold mb-4">Course Preview</h3>
                                <div className="space-y-3">
                                    <div className="text-sm">
                                        <span className="text-gray-600">Title:</span>
                                        <p className="font-medium">{formData.title || 'Untitled Course'}</p>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Category:</span>
                                        <p className="font-medium">{formData.category || 'Not selected'}</p>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Level:</span>
                                        <p className="font-medium capitalize">{formData.level}</p>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Price:</span>
                                        <p className="font-medium">
                                            {formData.price === 0 ? 'Free' : `${formData.currency} ${formData.price}`}
                                        </p>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600">Language:</span>
                                        <p className="font-medium">{formData.language}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <div className="p-6">
                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Create Course
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
