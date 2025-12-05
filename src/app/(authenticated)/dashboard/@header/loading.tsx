export default function HeaderLoading() {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-64 mb-2"></div>
            <div className="h-5 bg-slate-800 rounded w-80"></div>
          </div>
          <div className="hidden lg:flex items-center space-x-4 animate-pulse">
            <div className="text-right">
              <div className="h-4 bg-slate-800 rounded w-16 mb-1"></div>
              <div className="h-4 bg-slate-800 rounded w-24"></div>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
