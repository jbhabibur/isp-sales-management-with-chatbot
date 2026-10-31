"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CallbackRequest,
  getCallbackRequests,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminCallbacksPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = {
    title: isBn ? "কলব্যাক রিকোয়েস্ট" : "Callback Requests",
    subtitle: isBn
      ? "যেসব কাস্টমার এজেন্টের সাথে যোগাযোগ করতে চেয়েছেন তাদের তালিকা।"
      : "Customers who requested to be contacted by an agent.",
    dashboard: isBn ? "ড্যাশবোর্ড" : "Dashboard",
    total: isBn ? "মোট রিকোয়েস্ট" : "Total Requests",
    customer: isBn ? "কাস্টমারের নাম" : "Customer Name",
    phone: isBn ? "ফোন নম্বর" : "Phone Number",
    message: isBn ? "মেসেজ" : "Message",
    status: isBn ? "স্ট্যাটাস" : "Status",
    date: isBn ? "রিকোয়েস্টের সময়" : "Request Date",
    loading: isBn ? "লোড হচ্ছে..." : "Loading...",
    empty: isBn
      ? "কোনো কলব্যাক রিকোয়েস্ট পাওয়া যায়নি।"
      : "No callback requests found.",
    error: isBn
      ? "রিকোয়েস্ট লোড করা যায়নি।"
      : "Failed to load callback requests.",
    refresh: isBn ? "রিফ্রেশ" : "Refresh",
    logout: isBn ? "লগআউট" : "Logout",
    noMessage: isBn ? "কোনো মেসেজ নেই" : "No message",
  };

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await getCallbackRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || storedUser.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        await loadRequests();
      } catch {
        logout();
        router.replace("/login");
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleString(isBn ? "bn-BD" : "en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusStyle(status: string) {
    const normalized = status.toUpperCase();

    if (normalized === "NEW" || normalized === "PENDING") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (normalized === "COMPLETED" || normalized === "CONTACTED") {
      return "bg-green-100 text-green-800";
    }

    return "bg-gray-100 text-gray-700";
  }

  return (
    <div className="min-h-screen bg-[#fffcf3]">
      <header className="sticky top-0 z-30 border-b border-[#ebd69b] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/admin/dashboard"
            className="text-xl font-extrabold text-[#292319]"
          >
            Circle <span className="text-[#e9a900]">Network</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold hover:bg-[#fff3cf]"
            >
              {t.dashboard}
            </Link>

            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg bg-[#292319] px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#292319] sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-sm text-[#756b58]">{t.subtitle}</p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="rounded-lg bg-[#f5b91b] px-5 py-2.5 font-bold text-[#292319] hover:bg-[#e9a900] disabled:opacity-60"
          >
            {loading ? t.loading : t.refresh}
          </button>
        </div>

        <div className="mb-7 rounded-xl border border-[#ebd69b] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#756b58]">{t.total}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#292319]">
            {requests.length}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
            {t.loading}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
            {t.empty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#ebd69b] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#fff3cf] text-[#292319]">
                  <tr>
                    <th className="px-5 py-4">{t.customer}</th>
                    <th className="px-5 py-4">{t.phone}</th>
                    <th className="px-5 py-4">{t.message}</th>
                    <th className="px-5 py-4">{t.status}</th>
                    <th className="px-5 py-4">{t.date}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e5c8]">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {request.customer_name}
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={`tel:${request.phone}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {request.phone}
                        </a>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-[#756b58]">
                        {request.message || t.noMessage}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${statusStyle(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-[#756b58]">
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
