import { Shield, Package, GraduationCap, Car, Star, Home, Megaphone, DollarSign } from "lucide-react";

export default function ServicesLoading() {
  const serviceModules = [
    { icon: <Shield className="w-8 h-8" />, color: "bg-slate-700 text-slate-300" },
    { icon: <Package className="w-8 h-8" />, color: "bg-amber-500/20 text-amber-400" },
    { icon: <GraduationCap className="w-8 h-8" />, color: "bg-emerald-500/20 text-emerald-400" },
    { icon: <Car className="w-8 h-8" />, color: "bg-blue-500/20 text-blue-400" },
    { icon: <Star className="w-8 h-8" />, color: "bg-yellow-500/20 text-yellow-400" },
    { icon: <Home className="w-8 h-8" />, color: "bg-teal-500/20 text-teal-400" },
    { icon: <Megaphone className="w-8 h-8" />, color: "bg-purple-500/20 text-purple-400" },
    { icon: <DollarSign className="w-8 h-8" />, color: "bg-red-500/20 text-red-400" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-slate-800 rounded w-40 animate-pulse"></div>
        <div className="h-4 bg-slate-800 rounded w-24 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {serviceModules.map((_, index) => (
          <div
            key={index}
            className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl ${serviceModules[index].color} flex items-center justify-center`}>
                {serviceModules[index].icon}
              </div>
              <div className="w-5 h-5 bg-slate-800 rounded"></div>
            </div>
            
            <div className="mb-4">
              <div className="h-5 bg-slate-800 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
