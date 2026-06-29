export default function Loading() {
  return (
    <div style={{ padding: "2rem" }} className="animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 h-12" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-56 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
