"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageLoading from "../../components/AdminPageLoading";

import {
  getCurrentUser,
  getStoredUser,
  getFutureLeads,
  updateFutureLeadStatus,
  logout,
  type FutureLead,
  type FutureLeadStatus,
} from "@/lib/api";

import { useLanguage } from "../../components/LanguageProvider";

const STATUSES: FutureLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "COVERAGE_PLANNED",
  "CONVERTED",
  "REJECTED",
];

const STATUS_STYLES: Record<FutureLeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  INTERESTED: "bg-purple-100 text-purple-700",
  COVERAGE_PLANNED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminFutureLeadsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [leads, setLeads] = useState<FutureLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch leads
  const loadLeads = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const data = await getFutureLeads();
        setLeads(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isBn
              ? "Future Leads লোড করা যায়নি।"
              : "Failed to load future leads.",
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [isBn],
  );

  // Admin authentication + initial loading + auto refresh
  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function verifyAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser) {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!mounted) return;

        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        // First time full screen loading
        await loadLeads(true);

        if (!mounted) return;

        // Automatically fetch every 30 seconds
        // No loading screen during auto refresh
        intervalId = setInterval(() => {
          if (mounted) {
            loadLeads(false);
          }
        }, 30000);
      } catch {
        if (mounted) {
          logout();
          router.replace("/login");
        }
      }
    }

    verifyAdmin();

    return () => {
      mounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [router, loadLeads]);

  // Update lead status
  const handleStatusChange = async (
    leadId: number,
    status: FutureLeadStatus,
  ) => {
    try {
      setUpdatingId(leadId);
      setError("");

      await updateFutureLeadStatus(leadId, status);

      setLeads((previous) =>
        previous.map((lead) =>
          lead.id === leadId ? { ...lead, status } : lead,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Status পরিবর্তন করা যায়নি।"
            : "Failed to update status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        lead.customer_name.toLowerCase().includes(searchValue) ||
        lead.phone.toLowerCase().includes(searchValue);

      const matchesCity = !cityFilter || lead.city === cityFilter;

      const matchesArea = !areaFilter || lead.area === areaFilter;

      const matchesStatus = !statusFilter || lead.status === statusFilter;

      return matchesSearch && matchesCity && matchesArea && matchesStatus;
    });
  }, [leads, search, cityFilter, areaFilter, statusFilter]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "NEW").length,
      contacted: leads.filter((lead) => lead.status === "CONTACTED").length,
      converted: leads.filter((lead) => lead.status === "CONVERTED").length,
    }),
    [leads],
  );

  // City options
  const cities = useMemo(
    () => [...new Set(leads.map((lead) => lead.city))].sort(),
    [leads],
  );

  // Area options
  const areas = useMemo(
    () =>
      [
        ...new Set(
          leads
            .filter((lead) => !cityFilter || lead.city === cityFilter)
            .map((lead) => lead.area),
        ),
      ].sort(),
    [leads, cityFilter],
  );

  // Status labels
  const getStatusLabel = (status: string) => {
    const labels: Record<string, { bn: string; en: string }> = {
      NEW: { bn: "নতুন", en: "New" },
      CONTACTED: {
        bn: "যোগাযোগ করা হয়েছে",
        en: "Contacted",
      },
      INTERESTED: { bn: "আগ্রহী", en: "Interested" },
      COVERAGE_PLANNED: {
        bn: "কভারেজ পরিকল্পনাধীন",
        en: "Coverage Planned",
      },
      CONVERTED: {
        bn: "কনভার্ট হয়েছে",
        en: "Converted",
      },
      REJECTED: { bn: "বাতিল", en: "Rejected" },
    };

    return labels[status]?.[isBn ? "bn" : "en"] || status;
  };

  // Date formatting
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Logout
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const statusOptions = STATUSES.map((status) => ({
    value: status,
    label: getStatusLabel(status),
  }));

  return (
    <main className="min-h-screen bg-[#fffcf3] px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#e19112]">
              CIRCLE NETWORK
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#292319] sm:text-3xl">
              Future Leads
            </h1>

            <p className="mt-1 text-sm text-[#756b58]">
              {isBn
                ? "যেসব এলাকায় এখনো কভারেজ নেই, সেসব এলাকার সম্ভাব্য গ্রাহক।"
                : "Potential customers from areas where coverage is not available yet."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadLeads(false)}
              disabled={loading}
              className="rounded-lg border border-[#e9d69f] bg-white px-4 py-2.5 text-sm font-semibold text-[#59451c] transition hover:bg-[#fff5d9] disabled:opacity-50"
            >
              {isBn ? "রিফ্রেশ" : "Refresh"}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              {isBn ? "লগআউট" : "Logout"}
            </button>
          </div>
        </div>

        {/* Loading / Content */}
        {loading ? (
          <AdminPageLoading
            text={
              isBn ? "Future Leads লোড হচ্ছে..." : "Loading Future Leads..."
            }
          />
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: isBn ? "মোট লিড" : "Total Leads",
                  value: stats.total,
                  color: "text-[#292319]",
                  bg: "bg-white",
                },
                {
                  label: isBn ? "নতুন লিড" : "New Leads",
                  value: stats.new,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: isBn ? "যোগাযোগ করা হয়েছে" : "Contacted",
                  value: stats.contacted,
                  color: "text-yellow-700",
                  bg: "bg-yellow-50",
                },
                {
                  label: isBn ? "কনভার্ট হয়েছে" : "Converted",
                  value: stats.converted,
                  color: "text-green-700",
                  bg: "bg-green-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.bg} rounded-xl border border-[#eee3c9] p-4 shadow-sm`}
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

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Filters */}
            <section className="rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isBn
                      ? "নাম বা ফোন নম্বর খুঁজুন..."
                      : "Search name or phone..."
                  }
                  className="w-full rounded-lg border border-[#e8dfce] px-3 py-2.5 text-sm outline-none focus:border-[#e19112] focus:ring-2 focus:ring-[#e19112]/15"
                />

                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setAreaFilter("");
                  }}
                  className="w-full rounded-lg border border-[#e8dfce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e19112]"
                >
                  <option value="">{isBn ? "সকল শহর" : "All Cities"}</option>

                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full rounded-lg border border-[#e8dfce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e19112]"
                >
                  <option value="">{isBn ? "সকল এলাকা" : "All Areas"}</option>

                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-[#e8dfce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e19112]"
                >
                  <option value="">
                    {isBn ? "সকল স্ট্যাটাস" : "All Statuses"}
                  </option>

                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#756b58]">
                  {isBn
                    ? `দেখানো হচ্ছে ${filteredLeads.length} টি লিড`
                    : `Showing ${filteredLeads.length} leads`}
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setCityFilter("");
                    setAreaFilter("");
                    setStatusFilter("");
                  }}
                  className="text-xs font-semibold text-[#b7790b] hover:underline"
                >
                  {isBn ? "ফিল্টার রিসেট" : "Reset Filters"}
                </button>
              </div>
            </section>

            {/* Leads */}
            {filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-[#eee3c9] bg-white py-14 text-center">
                <p className="font-semibold text-[#292319]">
                  {isBn
                    ? "কোনো Future Lead পাওয়া যায়নি"
                    : "No Future Leads Found"}
                </p>

                <p className="mt-1 text-sm text-[#756b58]">
                  {isBn
                    ? "অন্য ফিল্টার দিয়ে চেষ্টা করুন।"
                    : "Try changing your filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredLeads.map((lead) => {
                    const status = lead.status as FutureLeadStatus;

                    return (
                      <article
                        key={lead.id}
                        className="rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-bold text-[#292319]">
                              {lead.customer_name}
                            </h3>

                            <a
                              href={`tel:${lead.phone}`}
                              className="mt-1 inline-block text-sm text-[#a56c09]"
                            >
                              {lead.phone}
                            </a>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {getStatusLabel(lead.status)}
                          </span>
                        </div>

                        <div className="my-4 grid grid-cols-2 gap-3 border-y border-[#f0e9da] py-3">
                          <div>
                            <p className="text-xs text-[#91836b]">
                              {isBn ? "শহর" : "City"}
                            </p>

                            <p className="mt-1 break-words text-sm font-medium text-[#292319]">
                              {lead.city}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[#91836b]">
                              {isBn ? "এলাকা" : "Area"}
                            </p>

                            <p className="mt-1 break-words text-sm font-medium text-[#292319]">
                              {lead.area}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs text-[#91836b]">
                              {isBn ? "ঠিকানা" : "Address"}
                            </p>

                            <p className="mt-1 break-words text-sm text-[#292319]">
                              {lead.address || "—"}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs text-[#91836b]">
                              {isBn ? "তৈরির তারিখ" : "Created At"}
                            </p>

                            <p className="mt-1 text-sm text-[#292319]">
                              {formatDate(lead.created_at)}
                            </p>
                          </div>
                        </div>

                        <label className="mb-1.5 block text-xs font-semibold text-[#756b58]">
                          {isBn ? "স্ট্যাটাস পরিবর্তন" : "Update Status"}
                        </label>

                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(e) =>
                            handleStatusChange(
                              lead.id,
                              e.target.value as FutureLeadStatus,
                            )
                          }
                          className="w-full rounded-lg border border-[#e8dfce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#e19112] disabled:opacity-50"
                        >
                          {STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {getStatusLabel(item)}
                            </option>
                          ))}
                        </select>

                        {updatingId === lead.id && (
                          <p className="mt-2 text-xs text-[#a56c09]">
                            {isBn ? "আপডেট হচ্ছে..." : "Updating..."}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden overflow-hidden rounded-xl border border-[#eee3c9] bg-white shadow-sm md:block">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-left">
                      <thead className="bg-[#fff7e4]">
                        <tr className="text-xs font-semibold uppercase tracking-wide text-[#756b58]">
                          <th className="px-4 py-4">
                            {isBn ? "গ্রাহকের নাম" : "Customer Name"}
                          </th>

                          <th className="px-4 py-4">
                            {isBn ? "ফোন" : "Phone"}
                          </th>

                          <th className="px-4 py-4">{isBn ? "শহর" : "City"}</th>

                          <th className="px-4 py-4">
                            {isBn ? "এলাকা" : "Area"}
                          </th>

                          <th className="px-4 py-4">
                            {isBn ? "ঠিকানা" : "Address"}
                          </th>

                          <th className="px-4 py-4">
                            {isBn ? "স্ট্যাটাস" : "Status"}
                          </th>

                          <th className="px-4 py-4">
                            {isBn ? "তৈরির তারিখ" : "Created At"}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#f0e9da]">
                        {filteredLeads.map((lead) => {
                          const status = lead.status as FutureLeadStatus;

                          return (
                            <tr
                              key={lead.id}
                              className="text-sm text-[#292319] transition hover:bg-[#fffdf7]"
                            >
                              <td className="px-4 py-4 font-semibold">
                                {lead.customer_name}
                              </td>

                              <td className="px-4 py-4">
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-[#a56c09] hover:underline"
                                >
                                  {lead.phone}
                                </a>
                              </td>

                              <td className="px-4 py-4">{lead.city}</td>

                              <td className="px-4 py-4">{lead.area}</td>

                              <td className="max-w-[200px] px-4 py-4">
                                <span className="line-clamp-2">
                                  {lead.address || "—"}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <select
                                  value={lead.status}
                                  disabled={updatingId === lead.id}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      lead.id,
                                      e.target.value as FutureLeadStatus,
                                    )
                                  }
                                  className={`max-w-[190px] rounded-lg border-0 px-2.5 py-2 text-xs font-semibold outline-none disabled:opacity-50 ${
                                    STATUS_STYLES[status] ||
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {STATUSES.map((item) => (
                                    <option key={item} value={item}>
                                      {getStatusLabel(item)}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-xs text-[#756b58]">
                                {formatDate(lead.created_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
