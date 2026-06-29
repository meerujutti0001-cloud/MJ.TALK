export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-slate-200 rounded-lg" />
        <div className="h-9 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-36 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
            </div>
            <div className="flex gap-3">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-slate-100 rounded-lg" />
              <div className="w-16 h-8 bg-slate-100 rounded-lg" />
              <div className="w-16 h-8 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
