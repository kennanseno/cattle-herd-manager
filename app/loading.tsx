export default function Loading() {
  return (
    <div
      className="min-h-full p-4 sm:p-6"
      role="status"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading page…</span>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border bg-card"
          />
        ))}
      </div>
      <div className="mt-4 h-80 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}
