/**
 * Shimmer skeleton matching the TrackerTile dimensions.
 * Prevents the "blank → snap-in" effect on Today's first paint.
 */
export function TodayTileSkeleton() {
  return (
    <div className="w-full bg-bg-surface border border-border rounded-[20px] p-4">
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-2xl bg-bg-elevated shimmer" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-2.5 w-16 rounded-full bg-bg-elevated shimmer" />
          <div className="h-4 w-32 rounded-full bg-bg-elevated shimmer" />
          <div className="h-2.5 w-24 rounded-full bg-bg-elevated shimmer" />
        </div>
      </div>
    </div>
  );
}
