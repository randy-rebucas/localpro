"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Star,
  Building2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Users,
  Eye,
  Edit
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { ListSkeleton } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRoleAccess } from "@/components/role-guard";
import { useAgencies } from "@/hooks/useAgencies";
import type { Agency } from "@/types/agencies";

const statuses = [
  "All Statuses",
  "Active",
  "Inactive",
  "Pending"
];

export default function AgenciesPage() {
  const router = useRouter();
  const { isAgencyOwner, isAgencyAdmin, isAdmin } = useRoleAccess();
  
  // Helper function to check if user has any of the specified roles
  const hasAccess = (roles: string[]): boolean => {
    return roles.some(role => {
      switch (role) {
        case "agency_owner":
          return isAgencyOwner;
        case "agency_admin":
          return isAgencyAdmin;
        case "admin":
          return isAdmin;
        default:
          return false;
      }
    });
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { agencies, loading, error, pagination, refetch } = useAgencies({
    status: selectedStatus !== "All Statuses" ? selectedStatus.toLowerCase() : undefined,
    page,
    limit: 12,
    sortBy,
    sortOrder,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Agencies" }]} />
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading agencies</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Agencies" }]} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Agencies</h1>
        <p className="text-gray-600">Discover and connect with service agencies</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            {hasAccess(["agency_owner", "admin"]) && (
              <Button onClick={() => router.push("/agencies/create")} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Agency
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <Select
              value={selectedStatus}
              onValueChange={(value) => handleStatusChange(value)}
              options={statuses.map(status => ({ value: status, label: status }))}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("name")}
                className="flex items-center gap-1"
              >
                {sortBy === "name" && (sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
                Sort by Name
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {pagination && (
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, pagination.total)} of {pagination.total} agencies
            </p>
          )}
        </div>
      </div>

      {/* Agencies List */}
      {loading ? (
        <ListSkeleton count={12} />
      ) : agencies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No agencies found</p>
          {hasAccess(["agency_owner", "admin"]) && (
            <Button onClick={() => router.push("/agencies/create")}>
              Create Your First Agency
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {agencies.map((agency: Agency) => (
              <Card key={agency._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={viewMode === "grid" ? "" : "flex gap-4"}>
                  {agency.contact?.address && (
                    <div className={viewMode === "grid" ? "relative h-48 w-full bg-gray-200" : "relative h-32 w-32 flex-shrink-0 bg-gray-200"}>
                      <Building2 className="absolute inset-0 m-auto w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{agency.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{agency.description}</p>
                      </div>
                      {agency.analytics && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{agency.analytics.averageRating?.toFixed(1) || 0}</span>
                        </div>
                      )}
                    </div>
                    {agency.services && agency.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {agency.services.slice(0, 3).map((service, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {service.category}
                          </span>
                        ))}
                      </div>
                    )}
                    {agency.providers && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Users className="w-4 h-4" />
                        <span>{agency.providers.length} providers</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/agencies/${agency._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {hasAccess(["agency_owner", "agency_admin", "admin"]) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/agencies/${agency._id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <div key={p} className="flex items-center gap-2">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                    <Button
                      variant={page === p ? "default" : "outline"}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button
                variant="outline"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

