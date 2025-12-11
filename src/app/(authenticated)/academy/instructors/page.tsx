"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Loading } from "@/components/ui/loading";
import { GraduationCap, ArrowLeft, Star, Search, BookOpen, Users } from "lucide-react";

type InstructorProfile = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  experience?: string | number;
  coursesCount?: number;
  specialties?: string[];
};

type InstructorsResponse =
  | { success?: boolean; data?: InstructorProfile[]; instructors?: InstructorProfile[] }
  | InstructorProfile[]
  | null;

const extractInstructors = (payload: unknown): InstructorProfile[] => {
  if (Array.isArray(payload)) return payload as InstructorProfile[];
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; users?: unknown; instructors?: unknown };
    if (Array.isArray(record.data)) return record.data as InstructorProfile[];
    if (Array.isArray(record.users)) return record.users as InstructorProfile[];
    if (Array.isArray(record.instructors)) return record.instructors as InstructorProfile[];
  }
  return [];
};

export default function AcademyInstructorsPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return instructors;
    const term = search.toLowerCase();
    return instructors.filter((i) =>
      [i.name, i.firstName, i.lastName, i.email, ...(i.specialties || [])]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term))
    );
  }, [instructors, search]);

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasToken = !!getApiToken();
      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?role=instructor&limit=20`;
      const res = await fetch(url, hasToken ? createAuthFetchOptions({ method: "GET" }) : { method: "GET" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to load instructors");
      }

      const data: InstructorsResponse = await res.json();
      let list: InstructorProfile[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        const record = data as { data?: unknown; users?: unknown; instructors?: unknown };
        list = extractInstructors(record.data) || extractInstructors(record) || [];
      }

      setInstructors(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load instructors";
      logger.error("Error fetching instructors", err instanceof Error ? err : new Error(String(err)));
      setError(message);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const renderStars = (rating = 0) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ));

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading size="lg" text="Loading instructors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-gray-300" />
        <div>
          <p className="text-lg font-semibold text-gray-800">Unable to load instructors</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button
          onClick={fetchInstructors}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Instructors</h1>
          <p className="text-sm text-gray-600">Meet the experts behind our academy courses.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search instructors by name, email, or specialty..."
          className="flex-1 text-sm outline-none"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-3 border border-dashed border-gray-200">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-lg font-semibold text-gray-800">No instructors found</p>
          <p className="text-sm text-gray-600">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((instructor) => {
            const name =
              instructor.name ||
              `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
              instructor.email ||
              "Instructor";
            const avatar = instructor.avatar;
            const rating = instructor.rating ?? 0;
            const coursesCount = instructor.coursesCount ?? 0;
            const specialties = instructor.specialties || [];

            return (
              <div key={instructor._id || instructor.id || name} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold overflow-hidden flex-shrink-0">
                  {avatar ? (
                    <Image src={avatar} alt={name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      {instructor.email && <p className="text-xs text-gray-500">{instructor.email}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      {renderStars(rating)}
                      <span className="ml-1">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  {instructor.bio && <p className="text-xs text-gray-600 line-clamp-2">{instructor.bio}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>{coursesCount} course{coursesCount === 1 ? "" : "s"}</span>
                    </div>
                    {instructor.experience && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{instructor.experience} yrs exp</span>
                      </div>
                    )}
                  </div>
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {specialties.slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs">
                          {s}
                        </span>
                      ))}
                      {specialties.length > 4 && (
                        <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-xs">
                          +{specialties.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

