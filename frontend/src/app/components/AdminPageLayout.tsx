"use client";

import React from "react";
import AdminPageLoading from "./AdminPageLoading";

interface StatItem {
  label: string;
  value: number | string;
  color: string;
  bg?: string;
}

interface AdminPageLayoutProps {
  title: string;
  subtitle: string;
  isBn: boolean;
  loading: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  error?: string;
  stats: StatItem[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  totalCount: number;
  foundText: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminPageLayout({
  title,
  subtitle,
  isBn,
  loading,
  refreshing = false,
  onRefresh,
  onLogout,
  error,
  stats,
  search,
  onSearchChange,
  searchPlaceholder,
  totalCount,
  foundText,
  filters,
  children,
}: AdminPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#fffcf3] px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header (Exact same as your screenshot) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#e19112]">
              CIRCLE NETWORK
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#292319] sm:text-3xl">
              {title}
            </h1>

            <p className="mt-1 text-sm text-[#756b58]">{subtitle}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              disabled={refreshing || loading}
              className="rounded-lg border border-[#e9d69f] bg-white px-4 py-2.5 text-sm font-semibold text-[#59451c] transition hover:bg-[#fff5d9] disabled:opacity-50"
            >
              {refreshing
                ? isBn
                  ? "রিফ্রেশ হচ্ছে..."
                  : "Refreshing..."
                : isBn
                  ? "রিফ্রেশ"
                  : "Refresh"}
            </button>

            <button
              onClick={onLogout}
              className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              {isBn ? "লগআউট" : "Logout"}
            </button>
          </div>
        </div>

        {loading ? (
          <AdminPageLoading text={isBn ? "লোড হচ্ছে..." : "Loading data..."} />
        ) : (
          <>
            {/* Statistics Cards (Exact same 4-box layout) */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className={`${
                    item.bg || "bg-white"
                  } rounded-xl border border-[#eee3c9] p-4 shadow-sm`}
                >
                  <p className="text-xs font-medium text-[#756b58] sm:text-sm">
                    {item.label}
                  </p>

                  <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Filters Section */}
            <section className="rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[#e8dfce] px-3 py-2.5 text-sm outline-none focus:border-[#e19112] focus:ring-2 focus:ring-[#e19112]/15"
                />
                {filters}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#756b58]">
                  {totalCount} {foundText}
                </p>
              </div>
            </section>

            {/* Page Specific Content (Cards & Tables) */}
            {children}
          </>
        )}
      </div>
    </main>
  );
}
