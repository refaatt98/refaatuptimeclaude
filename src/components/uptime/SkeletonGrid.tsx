export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-panel shimmer rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-3.5 w-36 rounded bg-muted" />
                <div className="h-2.5 w-24 rounded bg-muted" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-11 rounded-lg bg-muted" />
          <div className="mt-4 flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-2.5 w-20 rounded bg-muted" />
            </div>
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
