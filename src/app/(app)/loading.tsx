export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-6 w-40 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card h-[92px] p-4">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-2.5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card h-56 lg:col-span-2" />
        <div className="card h-56" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card h-52" />
        ))}
      </div>
    </div>
  );
}
