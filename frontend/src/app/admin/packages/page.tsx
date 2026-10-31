"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function PackageManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPackageId, setUpdatingPackageId] = useState<number | null>(
    null,
  );
  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [speed, setSpeed] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  async function loadPackages() {
    try {
      setError("");
      const data = await getAdminPackages();
      setPackages(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "প্যাকেজ লোড করা যায়নি"
            : "Failed to load packages",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser) {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        await loadPackages();
      } catch {
        if (active) {
          logout();
          router.replace("/login");
        }
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSpeed("");
    setMonthlyPrice("");
  }

  function handleEdit(pkg: Package) {
    setEditingId(pkg.id);
    setName(pkg.name);
    setSpeed(pkg.speed);
    setMonthlyPrice(String(pkg.monthly_price));
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const price = Number(monthlyPrice);

    if (!name.trim() || !speed.trim() || !monthlyPrice.trim()) {
      setError(isBn ? "সবগুলো তথ্য পূরণ করুন" : "Please fill in all fields");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError(
        isBn ? "সঠিক Monthly Price দিন" : "Please enter a valid monthly price",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = {
        name: name.trim(),
        speed: speed.trim(),
        monthly_price: price,
      };

      if (editingId !== null) {
        await updatePackage(editingId, data);

        setSuccess(
          isBn ? "প্যাকেজ সফলভাবে আপডেট হয়েছে" : "Package updated successfully",
        );
      } else {
        await createPackage(data);

        setSuccess(
          isBn ? "নতুন প্যাকেজ যোগ হয়েছে" : "New package added successfully",
        );
      }

      resetForm();
      await loadPackages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "প্যাকেজ সংরক্ষণ করা যায়নি"
            : "Failed to save package",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(pkg: Package) {
    try {
      setUpdatingPackageId(pkg.id);
      setError("");
      setSuccess("");

      await updatePackage(pkg.id, {
        is_active: !pkg.is_active,
      });

      setSuccess(
        isBn
          ? "প্যাকেজের Status আপডেট হয়েছে"
          : "Package status updated successfully",
      );

      await loadPackages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update package status",
      );
    } finally {
      setUpdatingPackageId(null);
    }
  }

  async function handleDelete(pkg: Package) {
    const confirmed = window.confirm(
      isBn
        ? `আপনি কি "${pkg.name}" প্যাকেজ Delete করতে নিশ্চিত? এই কাজটি Undo করা যাবে না।`
        : `Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingPackageId(pkg.id);
      setError("");
      setSuccess("");

      await deletePackage(pkg.id);

      setSuccess(
        isBn ? "প্যাকেজ সফলভাবে Delete হয়েছে" : "Package deleted successfully",
      );

      if (editingId === pkg.id) {
        resetForm();
      }

      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete package");
    } finally {
      setDeletingPackageId(null);
    }
  }

  const activeCount = packages.filter((pkg) => pkg.is_active).length;
  const inactiveCount = packages.length - activeCount;

  return (
    <div className="min-h-screen bg-[#fffcf3]">
      <header className="sticky top-0 z-40 border-b border-[#ebd69b] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Circle Network"
              width={100}
              height={50}
              className="h-10 w-auto object-contain"
            />

            <span className="text-lg font-extrabold text-[#292319] sm:text-xl">
              Circle <span className="text-[#e9a900]">Network</span>
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-[#fff3cf]"
          >
            ← {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#b88700]">
            {isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
          </p>

          <h1 className="text-2xl font-extrabold text-[#292319] sm:text-3xl">
            {isBn ? "Package Management" : "Package Management"}
          </h1>

          <p className="mt-2 text-sm text-[#756b58] sm:text-base">
            {isBn
              ? "Circle Network-এর ইন্টারনেট প্যাকেজ পরিচালনা করুন।"
              : "Manage Circle Network internet packages."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "মোট প্যাকেজ" : "Total Packages"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#292319]">
              {packages.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "সক্রিয় প্যাকেজ" : "Active Packages"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "নিষ্ক্রিয় প্যাকেজ" : "Inactive Packages"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Add/Edit Form */}
        <section className="mb-8 rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#292319]">
              {editingId !== null
                ? isBn
                  ? "প্যাকেজ সম্পাদনা করুন"
                  : "Edit Package"
                : isBn
                  ? "নতুন প্যাকেজ যোগ করুন"
                  : "Add New Package"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-[#9b7100] hover:underline"
              >
                {isBn ? "বাতিল করুন" : "Cancel"}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#292319]">
                  {isBn ? "প্যাকেজের নাম" : "Package Name"}
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Basic"
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#292319]">
                  {isBn ? "ইন্টারনেট স্পিড" : "Internet Speed"}
                </label>

                <input
                  type="text"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  placeholder="e.g. 30 Mbps"
                  required
                  maxLength={50}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#292319]">
                  {isBn ? "মাসিক মূল্য (৳)" : "Monthly Price (৳)"}
                </label>

                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="e.g. 800"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-[#f5b91b] px-6 py-3 text-sm font-bold text-[#292319] shadow-sm transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#292319] border-t-transparent" />
                  {isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}
                </>
              ) : editingId !== null ? (
                isBn ? (
                  "পরিবর্তন সংরক্ষণ করুন"
                ) : (
                  "Save Changes"
                )
              ) : isBn ? (
                "প্যাকেজ যোগ করুন"
              ) : (
                "Add Package"
              )}
            </button>
          </form>
        </section>

        {/* Package List */}
        <section className="overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebd69b] px-5 py-5 sm:px-7">
            <h2 className="text-xl font-bold text-[#292319]">
              {isBn ? "সকল ইন্টারনেট প্যাকেজ" : "All Internet Packages"}
            </h2>

            <button
              type="button"
              onClick={loadPackages}
              className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-[#fff3cf]"
            >
              ↻ {isBn ? "Refresh" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#756b58]">
              {isBn ? "লোড হচ্ছে..." : "Loading packages..."}
            </div>
          ) : packages.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#756b58]">
              {isBn ? "কোনো প্যাকেজ পাওয়া যায়নি।" : "No packages found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "প্যাকেজের নাম" : "Package Name"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "স্পিড" : "Speed"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "মাসিক মূল্য" : "Monthly Price"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "স্ট্যাটাস" : "Status"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "অ্যাকশন" : "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1e5c4]">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-medium text-[#756b58]">
                        #{pkg.id}
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {pkg.name}
                      </td>

                      <td className="px-5 py-4 text-[#292319]">{pkg.speed}</td>

                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        ৳{Number(pkg.monthly_price).toLocaleString("en-BD")}
                        <span className="ml-1 text-xs font-normal text-[#756b58]">
                          / {isBn ? "মাস" : "month"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            pkg.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(pkg)}
                            className="rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#755500] hover:bg-[#fff3cf]"
                          >
                            {isBn ? "Edit" : "Edit"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(pkg)}
                            disabled={
                              updatingPackageId === pkg.id ||
                              deletingPackageId === pkg.id
                            }
                            className="flex min-w-[105px] items-center justify-center gap-2 rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#292319] hover:bg-[#fff3cf] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingPackageId === pkg.id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#292319] border-t-transparent" />
                                Updating...
                              </>
                            ) : pkg.is_active ? (
                              isBn ? (
                                "Inactive করুন"
                              ) : (
                                "Deactivate"
                              )
                            ) : isBn ? (
                              "Active করুন"
                            ) : (
                              "Activate"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(pkg)}
                            disabled={
                              deletingPackageId === pkg.id ||
                              updatingPackageId === pkg.id
                            }
                            className="flex min-w-[90px] items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingPackageId === pkg.id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                Deleting...
                              </>
                            ) : isBn ? (
                              "Delete"
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
