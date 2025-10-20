export default function ActivityLoading() {
  return (
    <div className="lg:col-span-1">
      <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
