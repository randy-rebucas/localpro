"use client";

import { useState } from "react";
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
  ArrowRight
} from "lucide-react";

interface ServiceModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  services: string[];
  route: string;
}

const serviceModules: ServiceModule[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Demand services",
    icon: <Shield className="w-8 h-8" />,
    color: "bg-gray-100 text-gray-700",
    services: ["Cleaning", "Plumbing", "Electrical", "Moving"],
    route: "/marketplace"
  },
  {
    id: "supplies",
    name: "Supplies & Materials",
    description: "Resources and goods",
    icon: <Package className="w-8 h-8" />,
    color: "bg-amber-100 text-amber-700",
    services: ["Cleaning supplies", "Tools", "Subscription kits"],
    route: "/supplies"
  },
  {
    id: "academy",
    name: "Academy",
    description: "Educational and certification services",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "bg-green-100 text-green-700",
    services: ["Partner with TES", "Run courses", "Certification"],
    route: "/academy"
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Equipment and vehicle rentals",
    icon: <Car className="w-8 h-8" />,
    color: "bg-blue-100 text-blue-700",
    services: ["Tool and vehicle rentals"],
    route: "/rentals"
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium tier subscription service",
    icon: <Star className="w-8 h-8" />,
    color: "bg-yellow-100 text-yellow-700",
    services: ["Premium subscriptions", "Providers", "Clients"],
    route: "/plus"
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Facility-related services",
    icon: <Home className="w-8 h-8" />,
    color: "bg-emerald-100 text-emerald-700",
    services: ["Janitorial contracts", "Landscaping maintenance", "Pest control subscriptions"],
    route: "/facility"
  },
  {
    id: "ads",
    name: "Ads",
    description: "Advertising opportunities",
    icon: <Megaphone className="w-8 h-8" />,
    color: "bg-purple-100 text-purple-700",
    services: ["Advertising for hardware stores", "Suppliers", "Training schools"],
    route: "/ads"
  },
  {
    id: "finance",
    name: "Finance",
    description: "Financial services",
    icon: <DollarSign className="w-8 h-8" />,
    color: "bg-red-100 text-red-700",
    services: ["Salary advance", "Micro-loans", "Partner with fintech.company"],
    route: "/finance"
  }
];

export default function ServicesPage() {
  const [searchQuery] = useState("");
  const router = useRouter();

  const filteredModules = serviceModules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleModuleClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Service Modules</h3>
        <div className="text-sm text-gray-500">
          {filteredModules.length} of {serviceModules.length} services
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            onClick={() => handleModuleClick(module.route)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl ${module.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {module.icon}
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                {module.name}
              </h3>
              <p className="text-sm text-gray-500">
                {module.description}
              </p>
            </div>
            
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
          </div>
        ))}
      </div>
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
}
