"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageLayout from "../../components/AdminPageLayout";

import {
  type CallbackRequest,
  type CallbackStatus,
  type CallbackHistory,
  getCallbackRequests,
  getCallbackHistory,
  getCurrentUser,
  getStoredUser,
  logout,
  updateCallbackStatus,
} from "@/lib/api";

import { useLanguage } from "../../components/LanguageProvider";

const STATUS_OPTIONS: CallbackStatus[] = [
  "PENDING",
  "CONTACTED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_STYLES: Record<CallbackStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ACTION_STYLES: Record<string, string> = {
  CREATED: "bg-green-100 text-green-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  STATUS_CHANGED: "bg-blue-100 text-blue-700",
  NOTE_ADDED: "bg-amber-100 text-amber-700",
};

export default function AdminCallbacksPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // History states
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState<CallbackHistory[]>([]);
  const [selectedCallback, setSelectedCallback] =
    useState<CallbackRequest | null>(null);

  const t = {
    title: "Callback Requests",
    subtitle: isBn
      ? "গ্রাহকদের কলব্যাক অনুরোধ পরিচালনা করুন।"
      : "Manage customer callback requests.",
    total: isBn ? "মোট অনুরোধ" : "Total Requests",
    pending: isBn ? "অপেক্ষমাণ" : "Pending",
    contacted: isBn ? "যোগাযোগ করা হয়েছে" : "Contacted",
    completed: isBn ? "সম্পন্ন" : "Completed",
    customer: isBn ? "গ্রাহকের নাম" : "Customer Name",
    phone: isBn ? "ফোন নম্বর" : "Phone Number",
    message: isBn ? "মেসেজ" : "Message",
    status: isBn ? "স্ট্যাটাস" : "Status",
    date: isBn ? "অনুরোধের সময়" : "Request Date",
    search: isBn
      ? "নাম, ফোন অথবা মেসেজ দিয়ে খুঁজুন..."
      : "Search by name, phone or message...",
    allStatus: isBn ? "সকল Status" : "All Status",
    pendingLabel: isBn ? "অপেক্ষমাণ" : "Pending",
    contactedLabel: isBn ? "যোগাযোগ করা হয়েছে" : "Contacted",
    completedLabel: isBn ? "সম্পন্ন" : "Completed",
    cancelledLabel: isBn ? "বাতিল" : "Cancelled",
    empty: isBn
      ? "কোনো Callback Request পাওয়া যায়নি।"
      : "No callback requests found.",
    noMessage: isBn ? "কোনো মেসেজ নেই" : "No message",
    found: isBn ? "টি অনুরোধ পাওয়া গেছে" : "request(s) found",
    updating: isBn ? "আপডেট হচ্ছে..." : "Updating...",
    history: isBn ? "হিস্টোরি দেখুন" : "View History",
    historyTitle: isBn ? "Callback History" : "Callback History",
    historySubtitle: isBn
      ? "এই অনুরোধের সকল কার্যক্রম ও পরিবর্তনের বিবরণ"
      : "All activities and changes for this callback request",
    historyLoading: isBn ? "হিস্টোরি লোড হচ্ছে..." : "Loading history...",
    historyEmpty: isBn
      ? "এখনো কোনো History পাওয়া যায়নি।"
      : "No history available yet.",
    historyError: isBn
      ? "History লোড করা যায়নি। আবার চেষ্টা করুন।"
      : "Failed to load history. Please try again.",
    close: isBn ? "বন্ধ করুন" : "Close",
    created: isBn ? "অনুরোধ তৈরি" : "Request Created",
    assigned: isBn ? "Agent Assign" : "Agent Assigned",
    statusChanged: isBn ? "স্ট্যাটাস পরিবর্তন" : "Status Changed",
    noteAdded: isBn ? "নোট যোগ করা হয়েছে" : "Note Added",
    system: isBn ? "সিস্টেম" : "System",
    oldStatus: isBn ? "আগের অবস্থা" : "Previous Status",
    newStatus: isBn ? "নতুন অবস্থা" : "New Status",
    note: isBn ? "নোট" : "Note",
    changedBy: isBn ? "পরিবর্তন করেছেন" : "Changed by",
    event: isBn ? "কার্যক্রম" : "Activity",
  };

  const loadRequests = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      setError("");

      try {
        const data = await getCallbackRequests({ skip: 0, limit: 100 });
        setRequests(data.items);
        setTotal(data.total);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isBn
              ? "Callback Requests লোড করা যায়নি।"
              : "Failed to load callback requests.",
        );
      } finally {
        if (showLoading) setLoading(false);
        setRefreshing(false);
      }
    },
    [isBn],
  );

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval>;

    async function verifyAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || storedUser.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();
        if (!active) return;

        if (!user || user.role !== "ADMIN") {
          logout();
          router.replace("/login");
          return;
        }

        await loadRequests(true);
        if (!active) return;

        interval = setInterval(() => {
          loadRequests(false);
        }, 30000);
      } catch {
        if (active) {
          logout();
          router.replace("/login");
        }
      }
    }

    verifyAdmin();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [router, loadRequests]);

  // Load callback history
  const handleViewHistory = async (request: CallbackRequest) => {
    setSelectedCallback(request);
    setHistory([]);
    setHistoryError("");
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const data = await getCallbackHistory(request.id);
      setHistory(data);
    } catch {
      setHistoryError(t.historyError);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: CallbackStatus) => {
    const previousRequests = requests;

    setUpdatingId(id);
    setError("");

    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)),
    );

    try {
      const response = await updateCallbackStatus(id, newStatus);

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: response.status } : req,
        ),
      );

      // Refresh history if this callback's history modal is open
      if (historyOpen && selectedCallback?.id === id) {
        const updatedHistory = await getCallbackHistory(id);
        setHistory(updatedHistory);
      }
    } catch (err) {
      setRequests(previousRequests);

      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Status আপডেট করা যায়নি।"
            : "Failed to update status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        request.customer_name.toLowerCase().includes(searchText) ||
        request.phone.toLowerCase().includes(searchText) ||
        (request.message || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(
    () => [
      {
        label: t.total,
        value: total,
        color: "text-[#292319]",
        bg: "bg-white",
      },
      {
        label: t.pending,
        value: requests.filter((item) => item.status === "PENDING").length,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: t.contacted,
        value: requests.filter((item) => item.status === "CONTACTED").length,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: t.completed,
        value: requests.filter((item) => item.status === "COMPLETED").length,
        color: "text-green-600",
        bg: "bg-green-50",
      },
    ],
    [requests, total, t],
  );

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      PENDING: t.pendingLabel,
      CONTACTED: t.contactedLabel,
      COMPLETED: t.completedLabel,
      CANCELLED: t.cancelledLabel,
    };

    return labels[status] || status;
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      CREATED: t.created,
      ASSIGNED: t.assigned,
      STATUS_CHANGED: t.statusChanged,
      NOTE_ADDED: t.noteAdded,
    };

    return labels[action] || action;
  }

  function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date).toLocaleString(isBn ? "bn-BD" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function renderStatusSelect(request: CallbackRequest) {
    return (
      <select
        value={request.status}
        disabled={updatingId === request.id}
        onChange={(e) =>
          handleStatusChange(request.id, e.target.value as CallbackStatus)
        }
        className={`w-full rounded-lg border border-[#ead9b5] bg-white px-3 py-2 text-xs font-semibold outline-none transition focus:border-[#e19112] disabled:cursor-wait disabled:opacity-60 ${
          STATUS_STYLES[request.status]
        }`}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {getStatusLabel(status)}
          </option>
        ))}
      </select>
    );
  }

  function renderHistoryButton(request: CallbackRequest) {
    return (
      <button
        type="button"
        onClick={() => handleViewHistory(request)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e9d29f] bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#94630b] transition hover:border-[#e19112] hover:bg-[#fff0cc]"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {t.history}
      </button>
    );
  }

  return (
    <>
      <AdminPageLayout
        title={t.title}
        subtitle={t.subtitle}
        isBn={isBn}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => loadRequests(false)}
        onLogout={handleLogout}
        error={error}
        stats={stats}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.search}
        totalCount={filteredRequests.length}
        foundText={t.found}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-[#e8dfca] bg-white px-4 py-2.5 text-sm text-[#292319] outline-none focus:border-[#e19112]"
          >
            <option value="ALL">{t.allStatus}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        }
      >
        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-[#eee3c9] bg-white px-4 py-12 text-center text-sm text-[#756b58]">
              {t.empty}
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[#292319]">
                      {request.customer_name}
                    </p>

                    <a
                      href={`tel:${request.phone}`}
                      className="mt-1 inline-block text-sm font-medium text-[#b7790b] hover:underline"
                    >
                      {request.phone}
                    </a>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#fff7e5] px-2.5 py-1 text-xs font-semibold text-[#8a641d]">
                    #{request.id}
                  </span>
                </div>

                <div className="mt-3 border-t border-[#f1eadb] pt-3">
                  <p className="text-xs font-semibold text-[#756b58]">
                    {t.message}
                  </p>

                  <p className="mt-1 break-words text-sm text-[#514a3e]">
                    {request.message || t.noMessage}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold text-[#756b58]">
                    {t.status}
                  </p>

                  {renderStatusSelect(request)}

                  {updatingId === request.id && (
                    <p className="mt-1 text-xs text-[#756b58]">{t.updating}</p>
                  )}
                </div>

                <p className="mt-3 text-xs text-[#918675]">
                  {formatDate(request.created_at)}
                </p>

                <div className="mt-3 border-t border-[#f1eadb] pt-3">
                  {renderHistoryButton(request)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-hidden rounded-xl border border-[#eee3c9] bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#fff8e8] text-xs uppercase text-[#756b58]">
                <tr>
                  <th className="px-5 py-4 font-semibold">ID</th>
                  <th className="px-5 py-4 font-semibold">{t.customer}</th>
                  <th className="px-5 py-4 font-semibold">{t.phone}</th>
                  <th className="px-5 py-4 font-semibold">{t.message}</th>
                  <th className="px-5 py-4 font-semibold">{t.status}</th>
                  <th className="px-5 py-4 font-semibold">{t.date}</th>
                  <th className="px-5 py-4 font-semibold">{t.history}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f1eadb]">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-sm text-[#756b58]"
                    >
                      {t.empty}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="transition hover:bg-[#fffdf8]"
                    >
                      <td className="px-5 py-4 font-semibold text-[#756b58]">
                        #{request.id}
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {request.customer_name}
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={`tel:${request.phone}`}
                          className="font-medium text-[#b7790b] hover:underline"
                        >
                          {request.phone}
                        </a>
                      </td>

                      <td className="max-w-[220px] px-5 py-4 text-[#756b58]">
                        <p className="line-clamp-2">
                          {request.message || t.noMessage}
                        </p>
                      </td>

                      <td className="w-48 px-5 py-4">
                        {renderStatusSelect(request)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#756b58]">
                        {formatDate(request.created_at)}
                      </td>

                      <td className="w-40 px-5 py-4">
                        {renderHistoryButton(request)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminPageLayout>

      {/* Callback History Modal */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="callback-history-title"
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#eee3c9] bg-[#fffdf8] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#eee3c9] bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff2d5] text-[#b7790b]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="callback-history-title"
                      className="text-lg font-bold text-[#292319]"
                    >
                      {t.historyTitle}
                    </h2>

                    <p className="mt-0.5 text-xs text-[#756b58]">
                      {t.historySubtitle}
                    </p>
                  </div>
                </div>

                {selectedCallback && (
                  <div className="mt-3 rounded-lg bg-[#fff8e8] px-3 py-2">
                    <p className="text-sm font-semibold text-[#292319]">
                      {selectedCallback.customer_name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#756b58]">
                      #{selectedCallback.id} · {selectedCallback.phone}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label={t.close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#eee3c9] bg-white text-[#756b58] transition hover:bg-[#fff2d5] hover:text-[#292319]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="min-h-[200px] flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#f3dfb0] border-t-[#e19112]" />
                  <p className="mt-4 text-sm text-[#756b58]">
                    {t.historyLoading}
                  </p>
                </div>
              ) : historyError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-red-700">
                    {historyError}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      selectedCallback && handleViewHistory(selectedCallback)
                    }
                    className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    {isBn ? "আবার চেষ্টা করুন" : "Try Again"}
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e8d9b8] bg-white px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff5df] text-[#b7790b]">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#514a3e]">
                    {t.historyEmpty}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute bottom-3 left-[15px] top-3 w-px bg-[#eadbbd]" />

                  <div className="space-y-6">
                    {history.map((item) => (
                      <div key={item.id} className="relative flex gap-4">
                        {/* Timeline Marker */}
                        <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#fffdf8] bg-[#f7e6c2]">
                          <div className="h-2 w-2 rounded-full bg-[#c58b25]" />
                        </div>

                        {/* Timeline Content */}
                        <div className="min-w-0 flex-1 rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                                ACTION_STYLES[item.action] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {getActionLabel(item.action)}
                            </span>

                            <span className="text-[11px] text-[#918675]">
                              {formatDate(item.created_at)}
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-xs font-semibold text-[#756b58]">
                              {t.changedBy}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-[#292319]">
                              {item.actor_name || t.system}
                            </p>
                          </div>

                          {item.action === "STATUS_CHANGED" && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-lg bg-[#fff8e8] p-3">
                                <p className="text-[11px] font-medium text-[#756b58]">
                                  {t.oldStatus}
                                </p>
                                <p className="mt-1 text-xs font-bold text-[#8a641d]">
                                  {item.old_value
                                    ? getStatusLabel(item.old_value)
                                    : "—"}
                                </p>
                              </div>

                              <div className="rounded-lg bg-[#eef8ff] p-3">
                                <p className="text-[11px] font-medium text-[#756b58]">
                                  {t.newStatus}
                                </p>
                                <p className="mt-1 text-xs font-bold text-blue-700">
                                  {item.new_value
                                    ? getStatusLabel(item.new_value)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          )}

                          {item.action === "ASSIGNED" && (
                            <div className="mt-3 rounded-lg bg-purple-50 p-3">
                              <p className="text-[11px] font-medium text-purple-700">
                                {isBn ? "Agent ID" : "Agent ID"}
                              </p>
                              <p className="mt-1 text-sm font-bold text-purple-800">
                                {item.new_value || "—"}
                              </p>
                            </div>
                          )}

                          {item.note && (
                            <div className="mt-3 rounded-lg border border-[#eee3c9] bg-[#fffdf8] p-3">
                              <p className="text-[11px] font-semibold text-[#756b58]">
                                {t.note}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#514a3e]">
                                {item.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#eee3c9] bg-white px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="w-full rounded-lg bg-[#e19112] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c77d08] sm:w-auto sm:min-w-28"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
