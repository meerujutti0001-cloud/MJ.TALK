/* Conversations page — 3-panel inbox skeleton */
export default function Loading() {
  return (
    <div className="flex h-full bg-white overflow-hidden animate-pulse">
      {/* Left panel skeleton */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-100">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-slate-200 rounded" />
            <div className="h-7 w-7 rounded-full bg-slate-200" />
          </div>
          <div className="h-8 bg-slate-100 rounded-lg" />
        </div>
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-2 py-1 gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 h-8 bg-slate-100 rounded" />
          ))}
        </div>
        {/* Rows */}
        <div className="flex-1 divide-y divide-slate-50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                  <div className="h-3 w-12 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle panel — empty state */}
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 mx-auto" />
          <div className="h-4 w-36 bg-slate-200 rounded mx-auto" />
          <div className="h-3 w-48 bg-slate-100 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
