"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import AdminPageLayout from "../../components/AdminPageLayout";

export default function PackageManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [updatingPackageId, setUpdatingPackageId] = useState<number | null>(
    null,
  );
  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [speed, setSpeed] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  const loadPackages = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        }

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
        setRefreshing(false);
      }
    },
    [isBn],
  );

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
  }, [router, loadPackages]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSpeed("");
    setMonthlyPrice("");
    setError("");
  }

  function openCreateModal() {
    resetForm();
    setSuccess("");
    setIsModalOpen(true);
  }

  function handleEdit(pkg: Package) {
    setEditingId(pkg.id);
    setName(pkg.name);
    setSpeed(pkg.speed);
    setMonthlyPrice(String(pkg.monthly_price));
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    resetForm();
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

      setIsModalOpen(false);
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
        err instanceof Error
          ? err.message
          : isBn
            ? "প্যাকেজের Status আপডেট করা যায়নি"
            : "Failed to update package status",
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
        setIsModalOpen(false);
        resetForm();
      }

      await loadPackages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "প্যাকেজ Delete করা যায়নি"
            : "Failed to delete package",
      );
    } finally {
      setDeletingPackageId(null);
    }
  }

  const activeCount = packages.filter((pkg) => pkg.is_active).length;
  const inactiveCount = packages.length - activeCount;

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return packages;

    return packages.filter((pkg) =>
      [String(pkg.id), pkg.name, pkg.speed, String(pkg.monthly_price)].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [packages, search]);

  const stats = [
    {
      label: isBn ? "মোট প্যাকেজ" : "Total Packages",
      value: packages.length,
      color: "#292319",
      bg: "#fff8e7",
    },
    {
      label: isBn ? "সক্রিয় প্যাকেজ" : "Active Packages",
      value: activeCount,
      color: "#15803d",
      bg: "#f0fdf4",
    },
    {
      label: isBn ? "নিষ্ক্রিয় প্যাকেজ" : "Inactive Packages",
      value: inactiveCount,
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];

  return (
    <AdminPageLayout
      title={isBn ? "প্যাকেজ ম্যানেজমেন্ট" : "Package Management"}
      subtitle={
        isBn
          ? "Circle Network-এর ইন্টারনেট প্যাকেজ পরিচালনা করুন।"
          : "Manage Circle Network internet packages."
      }
      isBn={isBn}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => loadPackages(true)}
      onLogout={() => {
        logout();
        router.replace("/login");
      }}
      error={error}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={
        isBn
          ? "প্যাকেজের নাম, স্পিড বা ID দিয়ে খুঁজুন..."
          : "Search by package name, speed or ID..."
      }
      totalCount={packages.length}
      foundText={isBn ? "টি প্যাকেজ পাওয়া গেছে" : "packages found"}
    >
      <div className="space-y-6">
        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="font-bold">✓</span>
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto font-bold"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        {/* Page Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#292319]">
              {isBn ? "সকল ইন্টারনেট প্যাকেজ" : "All Internet Packages"}
            </h2>
            <p className="mt-1 text-sm text-[#756b58]">
              {isBn
                ? "আপনার ইন্টারনেট প্যাকেজগুলো পরিচালনা করুন।"
                : "Manage your internet packages."}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5b91b] px-5 py-3 text-sm font-bold text-[#292319] shadow-sm transition hover:bg-[#e9a900] sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            {isBn ? "নতুন প্যাকেজ যোগ করুন" : "Add New Package"}
          </button>
        </div>

        {/* Mobile Package Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredPackages.length === 0 ? (
            <div className="rounded-2xl border border-[#ebd69b] bg-white p-8 text-center text-sm text-[#756b58]">
              {search
                ? isBn
                  ? "কোনো প্যাকেজ পাওয়া যায়নি।"
                  : "No matching packages found."
                : isBn
                  ? "কোনো প্যাকেজ পাওয়া যায়নি।"
                  : "No packages found."}
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-2xl border border-[#ebd69b] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#9b7100]">
                      #{pkg.id}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold text-[#292319]">
                      {pkg.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#756b58]">{pkg.speed}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      pkg.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pkg.is_active
                      ? isBn
                        ? "সক্রিয়"
                        : "Active"
                      : isBn
                        ? "নিষ্ক্রিয়"
                        : "Inactive"}
                  </span>
                </div>

                <div className="my-4 border-t border-[#f1e5c4]" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#756b58]">
                      {isBn ? "মাসিক মূল্য" : "Monthly Price"}
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-[#292319]">
                      ৳{Number(pkg.monthly_price).toLocaleString("en-BD")}
                      <span className="ml-1 text-xs font-normal text-[#756b58]">
                        / {isBn ? "মাস" : "month"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(pkg)}
                    disabled={
                      updatingPackageId === pkg.id ||
                      deletingPackageId === pkg.id
                    }
                    className="rounded-lg border border-[#ebd69b] px-3 py-2.5 text-sm font-bold text-[#755500] hover:bg-[#fff3cf] disabled:opacity-50"
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
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#ebd69b] px-3 py-2.5 text-sm font-bold text-[#292319] hover:bg-[#fff3cf] disabled:opacity-50"
                  >
                    {updatingPackageId === pkg.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#292319] border-t-transparent" />
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
                    className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingPackageId === pkg.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : null}
                    {isBn ? "Delete" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Package Table */}
        <section className="hidden overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-sm md:block">
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
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-[#756b58]"
                    >
                      {search
                        ? isBn
                          ? "কোনো প্যাকেজ পাওয়া যায়নি।"
                          : "No matching packages found."
                        : isBn
                          ? "কোনো প্যাকেজ পাওয়া যায়নি।"
                          : "No packages found."}
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
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
                          {pkg.is_active
                            ? isBn
                              ? "সক্রিয়"
                              : "Active"
                            : isBn
                              ? "নিষ্ক্রিয়"
                              : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(pkg)}
                            disabled={
                              updatingPackageId === pkg.id ||
                              deletingPackageId === pkg.id
                            }
                            className="rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#755500] hover:bg-[#fff3cf] disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(pkg)}
                            disabled={
                              updatingPackageId === pkg.id ||
                              deletingPackageId === pkg.id
                            }
                            className="flex min-w-[105px] items-center justify-center gap-2 rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#292319] hover:bg-[#fff3cf] disabled:opacity-50"
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
                            className="flex min-w-[90px] items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingPackageId === pkg.id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add / Edit Package Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ebd69b] bg-[#fff8e7] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#292319] sm:text-xl">
                  {editingId !== null
                    ? isBn
                      ? "প্যাকেজ সম্পাদনা করুন"
                      : "Edit Package"
                    : isBn
                      ? "নতুন প্যাকেজ যোগ করুন"
                      : "Add New Package"}
                </h2>

                <p className="mt-1 text-xs text-[#756b58] sm:text-sm">
                  {isBn
                    ? "প্যাকেজের প্রয়োজনীয় তথ্য দিন।"
                    : "Enter the package information below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#756b58] transition hover:bg-[#f5e8c8] hover:text-[#292319] disabled:opacity-50"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                    disabled={saving}
                    autoFocus
                    className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none transition focus:border-[#e9a900] focus:ring-2 focus:ring-[#f5b91b]/20 disabled:opacity-60"
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
                    disabled={saving}
                    className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none transition focus:border-[#e9a900] focus:ring-2 focus:ring-[#f5b91b]/20 disabled:opacity-60"
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
                    disabled={saving}
                    className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none transition focus:border-[#e9a900] focus:ring-2 focus:ring-[#f5b91b]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#f1e5c4] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#ebd69b] px-5 py-3 text-sm font-bold text-[#756b58] transition hover:bg-[#fffcf3] disabled:opacity-50"
                >
                  {isBn ? "বাতিল করুন" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#f5b91b] px-6 py-3 text-sm font-bold text-[#292319] shadow-sm transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-60"
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
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
