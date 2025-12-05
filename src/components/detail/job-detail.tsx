"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Heart,
  Share2,
  Edit,
  CheckCircle2,
  Users,
  Award,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/jobs";
import { useSession } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/currency-utils";

interface JobDetailProps {
  job: Job;
  onApply?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
  hasApplied?: boolean;
}

export function JobDetail({
  job,
  onApply,
  onEdit,
  onFavorite,
  hasApplied = false,
}: JobDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEmployer = session?.user?.id === job.employer;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Company Logo */}
        <div className="md:w-1/3">
          {job.company?.logo ? (
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={job.company.logo.url || "/placeholder.png"}
                alt={job.company.name}
                fill
                className="object-contain p-4"
              />
            </div>
          ) : (
            <div className="h-64 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Building2 className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-xl text-gray-600 mb-1">{job.company.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onFavorite}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <p className="text-gray-700">{job.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {String(job.category)}
              </span>
            )}
            {job.jobType && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {job.jobType.replace("_", " ")}
              </span>
            )}
            {job.experienceLevel && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {job.experienceLevel}
              </span>
            )}
            {job.isRemote && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                Remote
              </span>
            )}
            {job.status && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                job.status === "active" ? "bg-green-100 text-green-800" :
                job.status === "paused" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {job.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {job.company?.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>
                  {job.company.location.city}, {job.company.location.state}
                  {job.isRemote && " (Remote Available)"}
                </span>
              </div>
            )}

            {job.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">
                  {formatCurrency(job.salary.min || 0, 'PHP')}
                  {job.salary.max && ` - ${formatCurrency(job.salary.max, 'PHP')}`}
                  {job.salary.period && `/${job.salary.period}`}
                </span>
              </div>
            )}
          </div>

          {hasApplied && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-800">You have applied for this position</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onApply && !isEmployer && !hasApplied && job.status === "active" && (
              <Button onClick={onApply} size="lg" className="flex-1">
                <Briefcase className="w-4 h-4 mr-2" />
                Apply Now
              </Button>
            )}
            {onEdit && isEmployer && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Job
              </Button>
            )}
            {hasApplied && (
              <Button
                onClick={() => router.push(`/jobs/${job._id}/application`)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                View Application
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {job.company && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-gray-600">Company Name</p>
                <p className="font-semibold">{job.company.name}</p>
              </div>
              {job.company.website && (
                <div>
                  <p className="text-gray-600">Website</p>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {job.company.website}
                  </a>
                </div>
              )}
              {job.company.size && (
                <div>
                  <p className="text-gray-600">Company Size</p>
                  <p className="font-semibold capitalize">{job.company.size}</p>
                </div>
              )}
              {job.company.industry && (
                <div>
                  <p className="text-gray-600">Industry</p>
                  <p className="font-semibold">{job.company.industry}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {job.salary && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Salary & Benefits
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-gray-600">Salary Range</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(job.salary.min || 0, 'PHP')}
                  {job.salary.max && ` - ${formatCurrency(job.salary.max, 'PHP')}`}
                  {job.salary.period && ` per ${job.salary.period}`}
                </p>
              </div>
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <p className="text-gray-600 mb-2">Benefits</p>
                  <ul className="space-y-1">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {job.requirements?.skills && job.requirements.skills.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.requirements.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {job.requirements?.other && job.requirements.other.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.other.map((requirement: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
            <ul className="space-y-2">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-purple-500 mt-0.5" />
                  <span>{responsibility}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.qualifications && job.qualifications.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
            <ul className="space-y-2">
              {job.qualifications.map((qualification, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{qualification}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.applicationProcess && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Process</h2>
            <div className="space-y-2">
              {job.applicationProcess.instructions && (
                <div className="text-gray-700 whitespace-pre-line">
                  {job.applicationProcess.instructions}
                </div>
              )}
              {job.applicationProcess.deadline && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">Application Deadline:</span>
                    <span className="font-semibold">
                      {new Date(job.applicationProcess.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

