import { Sparkles } from 'lucide-react';

interface SkeletonProps {
  count?: number;
}

/**
 * Projects Grid Skeleton Loader
 * Outputs multiple cards matching the 'Projects' layout
 */
export function ProjectsSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col justify-between text-left h-[460px]"
        >
          <div>
            <div className="h-64 bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="absolute top-4 left-4 bg-slate-300 w-24 h-6 rounded-md" />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-4 bg-slate-200 rounded-md" />
                <div className="w-3 h-3 bg-slate-200 rounded-full" />
                <div className="w-24 h-4 bg-slate-200 rounded-md" />
              </div>
              <div className="w-3/4 h-6 bg-slate-300 rounded-lg" />
              <div className="flex flex-col gap-2">
                <div className="w-full h-3.5 bg-slate-200 rounded" />
                <div className="w-11/12 h-3.5 bg-slate-200 rounded" />
                <div className="w-4/5 h-3.5 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 pt-2">
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <div className="w-20 h-5 bg-slate-200 rounded-full" />
              <div className="w-24 h-5 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-10 w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex flex-col justify-between text-left"
        >
          <div>
            <div className="h-[280px] sm:h-[360px] bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="absolute bottom-4 left-6 bg-slate-300 w-24 h-6 rounded-md" />
            </div>
            <div className="p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-4 bg-slate-200 rounded-md" />
                <div className="w-3 h-3 bg-slate-200 rounded-full" />
                <div className="w-24 h-4 bg-slate-200 rounded-md" />
              </div>
              <div className="w-3/4 h-6 bg-slate-300 rounded-lg" />
              <div className="flex flex-col gap-2">
                <div className="w-full h-3.5 bg-slate-200 rounded" />
                <div className="w-11/12 h-3.5 bg-slate-200 rounded" />
              </div>
              <div className="flex gap-2 pt-1">
                <div className="w-16 h-5 bg-slate-200 rounded-md" />
                <div className="w-12 h-5 bg-slate-200 rounded-md" />
                <div className="w-14 h-5 bg-slate-200 rounded-md" />
              </div>
            </div>
          </div>
          <div className="px-6 sm:px-8 pb-8 pt-2">
            <div className="w-32 h-10 bg-slate-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
      <div className="lg:col-span-8 flex flex-col gap-8 text-left">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="w-32 h-4 bg-slate-200 rounded-md" />
          <div className="w-24 h-8 bg-slate-200 rounded-full" />
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex flex-wrap gap-5">
            <div className="w-24 h-4 bg-slate-200 rounded-md" />
            <div className="w-32 h-4 bg-slate-200 rounded-md" />
            <div className="w-20 h-4 bg-slate-200 rounded-md" />
          </div>
          <div className="aspect-[16/10] rounded-2xl bg-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-3/4 h-4 bg-slate-200 rounded" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-5/6 h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-2/3 h-4 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="w-16 h-6 bg-slate-200 rounded-md" />
            <div className="w-12 h-6 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="bg-linen rounded-3xl p-6 sm:p-8 border border-accent/10 flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <div className="w-24 h-3 bg-slate-300 rounded-md" />
            <div className="w-48 h-5 bg-slate-300 rounded-lg" />
            <div className="w-full h-3 bg-slate-200 rounded" />
            <div className="w-5/6 h-3 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="w-40 h-6 bg-slate-200 rounded-lg" />
          <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-32 h-4 bg-slate-200 rounded-md" />
                <div className="w-full h-3 bg-slate-200 rounded" />
                <div className="w-3/4 h-3 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-32 h-4 bg-slate-200 rounded-md" />
                <div className="w-full h-3 bg-slate-200 rounded" />
                <div className="w-3/4 h-3 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 flex flex-col gap-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-50 shadow-md flex flex-col gap-5">
          <div className="w-32 h-5 bg-slate-200 rounded-lg" />
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center border-b border-slate-50 pb-4">
              <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-full h-4 bg-slate-200 rounded" />
                <div className="w-16 h-3 bg-slate-200 rounded-md" />
              </div>
            </div>
            <div className="flex gap-4 items-center border-b border-slate-50 pb-4">
              <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-full h-4 bg-slate-200 rounded" />
                <div className="w-16 h-3 bg-slate-200 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#102417] text-white rounded-3xl p-8 border border-white/5 shadow-md flex flex-col gap-4">
          <div className="w-40 h-6 bg-white/20 rounded-lg" />
          <div className="w-full h-3 bg-white/10 rounded" />
          <div className="w-full h-3 bg-white/10 rounded" />
          <div className="w-full h-10 bg-primary/50 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Menu Grid Skeleton Loader
 * Outputs multiple horizontal / vertical items matching the 'Menu' food card layouts
 */
export function MenuSkeleton({ count = 6 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 border border-slate-50 shadow-sm h-auto sm:h-48 text-left relative overflow-hidden"
        >
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-200 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="flex-1 flex flex-col gap-3.5 w-full">
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-200 pb-2.5">
              <div className="w-1/2 h-5 bg-slate-300 rounded-lg" />
              <div className="w-12 h-5 bg-slate-300 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-3 bg-slate-200 rounded" />
              <div className="w-11/12 h-3 bg-slate-200 rounded" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="w-16 h-5 bg-slate-200 rounded-md" />
              <div className="w-12 h-5 bg-slate-150 rounded-md" />
              <div className="w-14 h-5 bg-slate-150 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
