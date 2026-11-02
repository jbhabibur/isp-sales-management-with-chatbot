"use client";

import { useLanguage } from "./LanguageProvider";

interface AdminPageLoadingProps {
  text?: string;
  showStats?: boolean;
  showFilters?: boolean;
}

export default function AdminPageLoading({
  text,
  showStats = true,
  showFilters = true,
}: AdminPageLoadingProps) {
  const { language } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className="space-y-5">
      {/* Statistics Skeleton */}
      {showStats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-[#eee3c9] bg-white p-4"
            >
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-4 h-7 w-14 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Filters Skeleton */}
      {showFilters && (
        <div className="animate-pulse rounded-xl border border-[#eee3c9] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      <div className="rounded-xl border border-[#eee3c9] bg-white py-12 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#f3dfb0] border-t-[#e19112]" />

        <p className="mt-4 text-sm font-medium text-[#756b58]">
          {text || (isBn ? "ডাটা লোড হচ্ছে..." : "Loading data...")}
        </p>
      </div>
    </div>
  );
}
