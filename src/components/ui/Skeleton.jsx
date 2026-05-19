// Skeleton card for loading state
export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden">
      <div className="skeleton aspect-[2/3]" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 rounded w-full" />
        <div className="skeleton h-3 rounded w-2/3" />
      </div>
    </div>
  )
}

// Skeleton for wide cards
export function SkeletonWide() {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-bg-elevated">
      <div className="skeleton w-20 h-28 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-3 py-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-full" />
        <div className="skeleton h-3 rounded w-2/3" />
      </div>
    </div>
  )
}

// Hero skeleton
export function SkeletonHero() {
  return (
    <div className="skeleton w-full" style={{ height: '85vh' }} />
  )
}

// Text skeleton
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
