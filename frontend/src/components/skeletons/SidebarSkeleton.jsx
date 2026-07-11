import { Users } from "lucide-react";

const shimmerClass =
  "relative overflow-hidden bg-surface-2 before:absolute before:inset-0 " +
  "before:-translate-x-full before:animate-shimmer " +
  "before:bg-gradient-to-r before:from-transparent before:via-surface-3/80 before:to-transparent";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-[76px] lg:w-[300px] border-r border-line bg-surface flex flex-col shrink-0">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center gap-2 text-ink">
          <Users className="size-[18px]" />
          <span className="font-semibold text-sm hidden lg:block">Messages</span>
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="flex-1 overflow-y-auto w-full py-3">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3">
            {/* Avatar skeleton */}
            <div className="relative mx-auto lg:mx-0">
              <div className={`size-12 rounded-full ${shimmerClass}`} />
            </div>

            {/* User info skeleton - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className={`h-4 w-32 mb-2 rounded ${shimmerClass}`} />
              <div className={`h-3 w-16 rounded ${shimmerClass}`} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
