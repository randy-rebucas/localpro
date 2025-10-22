"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Package, 
  GraduationCap, 
  Car, 
  Star, 
  Home, 
  Megaphone, 
  DollarSign,
  Search,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  X,
  Users,
  Clock
} from "lucide-react";

interface ServiceModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  services: string[];
  route: string;
  category: string;
  status: "active" | "coming-soon" | "beta";
  users?: number;
  lastUpdated?: string;
  featured?: boolean;
}

const serviceModules: ServiceModule[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Connect with service providers and customers",
    icon: <Shield className="w-8 h-8" />,
    color: "bg-gray-100 text-gray-700",
    services: ["Cleaning", "Plumbing", "Electrical", "Moving"],
    route: "/marketplace",
    category: "Services",
    status: "active",
    users: 1250,
    lastUpdated: "2 hours ago",
    featured: true
  },
  {
    id: "supplies",
    name: "Supplies & Materials",
    description: "Source tools and materials for your projects",
    icon: <Package className="w-8 h-8" />,
    color: "bg-amber-100 text-amber-700",
    services: ["Cleaning supplies", "Tools", "Subscription kits"],
    route: "/supplies",
    category: "Resources",
    status: "coming-soon",
    users: 0,
    lastUpdated: "Coming soon",
    featured: false
  },
  {
    id: "academy",
    name: "Academy",
    description: "Learn new skills and get certified",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "bg-green-100 text-green-700",
    services: ["Partner with TES", "Run courses", "Certification"],
    route: "/academy",
    category: "Education",
    status: "coming-soon",
    users: 0,
    lastUpdated: "Coming soon",
    featured: false
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Rent equipment and vehicles",
    icon: <Car className="w-8 h-8" />,
    color: "bg-blue-100 text-blue-700",
    services: ["Tool and vehicle rentals"],
    route: "/rentals",
    category: "Resources",
    status: "beta",
    users: 450,
    lastUpdated: "5 hours ago",
    featured: false
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium features and priority support",
    icon: <Star className="w-8 h-8" />,
    color: "bg-yellow-100 text-yellow-700",
    services: ["Premium subscriptions", "Providers", "Clients"],
    route: "/plus",
    category: "Premium",
    status: "active",
    users: 320,
    lastUpdated: "1 hour ago",
    featured: true
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Professional facility management services",
    icon: <Home className="w-8 h-8" />,
    color: "bg-emerald-100 text-emerald-700",
    services: ["Janitorial contracts", "Landscaping maintenance", "Pest control subscriptions"],
    route: "/facility",
    category: "Services",
    status: "coming-soon",
    users: 0,
    lastUpdated: "Coming soon",
    featured: false
  },
  {
    id: "ads",
    name: "Ads",
    description: "Promote your business and reach customers",
    icon: <Megaphone className="w-8 h-8" />,
    color: "bg-purple-100 text-purple-700",
    services: ["Advertising for hardware stores", "Suppliers", "Training schools"],
    route: "/ads",
    category: "Marketing",
    status: "active",
    users: 680,
    lastUpdated: "4 hours ago",
    featured: false
  },
  {
    id: "finance",
    name: "Finance",
    description: "Financial services and payment solutions",
    icon: <DollarSign className="w-8 h-8" />,
    color: "bg-red-100 text-red-700",
    services: ["Salary advance", "Micro-loans", "Partner with fintech.company"],
    route: "/finance",
    category: "Financial",
    status: "coming-soon",
    users: 0,
    lastUpdated: "Coming soon",
    featured: false
  }
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ["all", ...new Set(serviceModules.map(module => module.category))];
    return cats;
  }, []);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    let filtered = serviceModules;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(module =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(module => module.category === selectedCategory);
    }

    // Sort by status priority, then featured, then by name
    return filtered.sort((a, b) => {
      // Define status priority order
      const statusPriority = { 'active': 1, 'beta': 2, 'coming-soon': 3 };
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 4;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 4;
      
      // First sort by status priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then by featured status
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory]);

  const handleModuleClick = (module: ServiceModule) => {
    if (module.status === "coming-soon") {
      return; // Don't navigate for coming soon items
    }
    router.push(module.route);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case "beta":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Beta</span>;
      case "coming-soon":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Coming Soon</span>;
      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Service Modules</h3>
          <p className="text-gray-600 mt-1">
            {filteredModules.length} of {serviceModules.length} services available
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
        </div>
      </div>

      {/* Category filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category === "all" ? "All Services" : category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services grid/list */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className={`group bg-white rounded-2xl shadow-sm p-6 transition-all duration-300 transform hover:-translate-y-1 ${
                module.status === "coming-soon" 
                  ? "opacity-60 cursor-not-allowed" 
                  : "hover:shadow-xl cursor-pointer"
              }`}
              onClick={() => handleModuleClick(module)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 rounded-2xl ${module.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  {module.icon}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(module.status)}
                  {module.featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {module.description}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  {module.services.slice(0, 3).map((service, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                      {service}
                    </div>
                  ))}
                  {module.services.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{module.services.length - 3} more services
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{module.users?.toLocaleString() || 0} users</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{module.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className={`group bg-white rounded-xl shadow-sm p-6 transition-all duration-300 ${
                module.status === "coming-soon" 
                  ? "opacity-60 cursor-not-allowed" 
                  : "hover:shadow-md cursor-pointer"
              }`}
              onClick={() => handleModuleClick(module)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center shadow-sm`}>
                  {module.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                      {module.name}
                    </h3>
                    {getStatusBadge(module.status)}
                    {module.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {module.users?.toLocaleString() || 0} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.lastUpdated}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {module.category}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search terms or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
