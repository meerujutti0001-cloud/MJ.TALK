export default function Loading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-slate-200 rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-9 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
