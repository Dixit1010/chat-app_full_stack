const BUBBLE_WIDTHS = [180, 220, 140, 200, 160, 190];

const shimmerClass =
  "relative overflow-hidden bg-surface-2 before:absolute before:inset-0 " +
  "before:-translate-x-full before:animate-shimmer " +
  "before:bg-gradient-to-r before:from-transparent before:via-surface-3/80 before:to-transparent";

const MessageSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
      {BUBBLE_WIDTHS.map((width, idx) => (
        <div key={width} className={`flex items-end gap-2 ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
          {/* avatar skeleton */}
          {idx % 2 === 0 && (
            <div className={`size-8 rounded-full shrink-0 ${shimmerClass}`} />
          )}
          
          <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[60%] ${idx % 2 === 0 ? "items-start" : "items-end"}`}>
            {/* Message skeleton */}
            <div
              className={`h-9 rounded-2xl ${shimmerClass} ${idx % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm"}`}
              style={{ width: `${width}px` }}
            />
          </div>

          {/* avatar skeleton for right side */}
          {idx % 2 !== 0 && (
            <div className={`size-8 rounded-full shrink-0 ${shimmerClass}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
