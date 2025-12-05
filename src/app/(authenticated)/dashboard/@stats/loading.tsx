export default function StatsLoading() {
  return (
    <div className="lg:col-span-2">
      <div className="h-6 bg-slate-800 rounded w-32 mb-6 animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
              <div className="w-5 h-5 bg-slate-800 rounded"></div>
            </div>
            <div className="h-5 bg-slate-800 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-800 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
