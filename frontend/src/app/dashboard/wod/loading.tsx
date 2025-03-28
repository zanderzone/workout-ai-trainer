export default function WodLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="animate-pulse space-y-6">
          {/* Title Skeleton */}
          <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
          
          {/* Form Area Skeleton */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-12 bg-gray-300 rounded mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 