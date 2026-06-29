export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-slate-200 rounded-lg" />
        <div className="h-9 w-48 bg-slate-100 rounded-lg" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
        <div className="h-48 bg-slate-100 rounded-lg" />
      </div>
      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="h-4 w-36 bg-slate-200 rounded mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-3 flex-1 bg-slate-100 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
