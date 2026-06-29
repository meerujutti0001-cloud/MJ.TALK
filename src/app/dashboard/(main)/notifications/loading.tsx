export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-slate-200 rounded-lg" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
