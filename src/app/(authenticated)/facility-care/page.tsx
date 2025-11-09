"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Filter,
  Plus,
  Star,
  Home,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
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
import { useFacilityCare } from "@/hooks/useFacilityCare";

const categories = [
  "All Categories",
  "Janitorial",
  "Landscaping",
  "Pest Control",
  "Maintenance",
  "Security"
];

const statuses = [
  "All Statuses",
  "Active",
  "Inactive",
  "Pending"
];

export default function FacilityCarePage() {
  const router = useRouter();
  const { isProvider, isAdmin } = useRoleAccess();
  
  // Helper function to check if user has any of the specified roles
  const hasAccess = (roles: string[]): boolean => {
    return roles.some(role => {
      switch (role) {
        case "provider":
          return isProvider;
        case "admin":
          return isAdmin;
        default:
          return false;
      }
    });
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { services, loading, error, pagination, refetch } = useFacilityCare({
    category: selectedCategory !== "All Categories" ? selectedCategory.toLowerCase().replace(" ", "_") : undefined,
    isActive: selectedStatus === "Active" ? true : selectedStatus === "Inactive" ? false : undefined,
    page,
    limit: 12,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

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
        <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Facility Care" }]} />
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading facility care services</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Facility Care" }]} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Facility Care Services</h1>
        <p className="text-gray-600">Manage and discover facility care services</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search facility care services..."
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
            {hasAccess(["provider", "admin"]) && (
              <Button onClick={() => router.push("/facility-care/create")} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Service
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <Select
              value={selectedCategory}
              onValueChange={(value) => handleCategoryChange(value)}
              options={categories.map(cat => ({ value: cat, label: cat }))}
            />
            <Select
              value={selectedStatus}
              onValueChange={(value) => handleStatusChange(value)}
              options={statuses.map(status => ({ value: status, label: status }))}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("rating")}
                className="flex items-center gap-1"
              >
                {sortBy === "rating" && (sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
                Sort by Rating
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
              Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, pagination.total)} of {pagination.total} services
            </p>
          )}
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <ListSkeleton count={12} />
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No facility care services found</p>
          {hasAccess(["provider", "admin"]) && (
            <Button onClick={() => router.push("/facility-care/create")}>
              Create Your First Service
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {services.map((service) => (
              <Card key={service._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={viewMode === "grid" ? "" : "flex gap-4"}>
                  {service.images && service.images.length > 0 && (
                    <div className={viewMode === "grid" ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"}>
                      <Image
                        src={service.images[0] || "/placeholder.png"}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                      </div>
                      {service.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{service.rating.average?.toFixed(1) || 0}</span>
                        </div>
                      )}
                    </div>
                    {service.category && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mb-2">
                        {service.category}
                      </span>
                    )}
                    {service.pricing && (
                      <div className="mt-2">
                        <span className="text-lg font-bold">
                          ${service.pricing.basePrice}
                          {service.pricing.type === "hourly" && "/hr"}
                          {service.pricing.type === "monthly" && "/mo"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/facility-care/${service._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {hasAccess(["provider", "admin"]) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/facility-care/${service._id}/edit`)}
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

