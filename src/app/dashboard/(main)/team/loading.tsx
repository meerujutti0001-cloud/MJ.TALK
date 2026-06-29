export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-56 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
            <div className="w-7 h-7 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
