"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import {
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  Home,
  Star,
  ArrowRight,
} from "lucide-react";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

interface ServiceModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  route: string;
}

const serviceModules: ServiceModule[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy & sell locally",
    icon: <Store className="w-8 h-8" />,
    iconBgColor: "bg-blue-100",
    iconTextColor: "text-blue-600",
    route: PACKAGE_REGISTRY.marketplace.route,
  },
  {
    id: "supplies",
    name: "Supplies",
    description: "Equipment & tools",
    icon: <Package className="w-8 h-8" />,
    iconBgColor: "bg-orange-100",
    iconTextColor: "text-orange-600",
    route: PACKAGE_REGISTRY.supplies.route,
  },
  {
    id: "academy",
    name: "Academy",
    description: "Learn & grow",
    icon: <GraduationCap className="w-8 h-8" />,
    iconBgColor: "bg-green-100",
    iconTextColor: "text-green-600",
    route: PACKAGE_REGISTRY.academy.route,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Manage money",
    icon: <CreditCard className="w-8 h-8" />,
    iconBgColor: "bg-purple-100",
    iconTextColor: "text-purple-600",
    route: PACKAGE_REGISTRY.finance.route,
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Rent equipment",
    icon: <Car className="w-8 h-8" />,
    iconBgColor: "bg-red-100",
    iconTextColor: "text-red-600",
    route: PACKAGE_REGISTRY.rentals.route,
  },
  {
    id: "ads",
    name: "Ads",
    description: "Promote business",
    icon: <Megaphone className="w-8 h-8" />,
    iconBgColor: "bg-teal-100",
    iconTextColor: "text-teal-600",
    route: PACKAGE_REGISTRY.ads.route,
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Maintenance services",
    icon: <Home className="w-8 h-8" />,
    iconBgColor: "bg-emerald-100",
    iconTextColor: "text-emerald-600",
    route: PACKAGE_REGISTRY.facility.route,
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium features",
    icon: <Star className="w-8 h-8" />,
    iconBgColor: "bg-yellow-100",
    iconTextColor: "text-yellow-600",
    route: PACKAGE_REGISTRY.plus.route,
  },
];

export function ServicesOverview() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleServiceClick = (route: string) => {
    router.push(route);
  };

  const getUserDisplayName = () => {
    if (session?.user?.firstName) {
      return session.user.firstName;
    }
    if (session?.user?.name) {
      return session.user.name.split(" ")[0];
    }
    return "there";
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Welcome Header */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">LocalPro</h1>
                <p className="text-sm text-gray-500">Super App</p>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Welcome back, {getUserDisplayName()}!
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
              Access all your services from one central hub. Everything you need, right at your fingertips.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">All Services</h3>
          <p className="text-sm text-gray-600">Explore all available modules and features</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {serviceModules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleServiceClick(module.route)}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 ${module.iconBgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  <div className={module.iconTextColor}>
                    {module.icon}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
              </div>
              
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                {module.name}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {module.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

