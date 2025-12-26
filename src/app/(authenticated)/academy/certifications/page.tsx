"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, ShieldCheck, BookOpen } from "lucide-react";

export default function AcademyCertificationsPage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/academy")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to academy"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Certifications</h1>
          <p className="text-sm text-gray-600">Verify your learning and achievements.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
            <p className="text-sm text-gray-600">
              Certification listings and management will appear here. Check back soon, or browse courses in the meantime.
            </p>
          </div>
        </div>
        <Link
          href="/academy/courses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors w-fit"
        >
          <BookOpen className="w-4 h-4" />
          Browse Courses
        </Link>
      </div>
    </div>
  );
}

