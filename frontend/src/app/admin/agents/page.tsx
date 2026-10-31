"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  AgentCreateData,
  AgentUpdateData,
  SalesAgent,
  createAgent,
  deleteAgent,
  getAgents,
  getCurrentUser,
  getStoredUser,
  logout,
  updateAgent,
  updateAgentStatus,
} from "@/lib/api";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminAgentsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Agent তালিকা লোড করা যায়নি"
            : "Could not load agents",
      );
    } finally {
      setLoading(false);
    }
  }, [isBn]);

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
          logout();
          router.replace("/login");
          return;
        }

        await loadAgents();
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
    };
  }, [router, loadAgents]);

  function resetForm() {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setPassword("");
  }

  function startEdit(agent: SalesAgent) {
    setEditingId(agent.id);
    setFullName(agent.full_name);
    setEmail(agent.email);
    setPassword("");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        const data: AgentUpdateData = {
          full_name: fullName.trim(),
          email: email.trim(),
        };

        await updateAgent(editingId, data);

        setSuccess(
          isBn ? "Agent-এর তথ্য আপডেট হয়েছে" : "Agent updated successfully",
        );
      } else {
        const data: AgentCreateData = {
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        };

        await createAgent(data);

        setSuccess(
          isBn
            ? "নতুন Sales Agent তৈরি হয়েছে"
            : "Sales agent created successfully",
        );
      }

      resetForm();
      await loadAgents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "কাজটি সম্পন্ন করা যায়নি"
            : "Operation failed",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle(agent: SalesAgent) {
    const action = agent.is_active
      ? isBn
        ? "Inactive"
        : "deactivate"
      : isBn
        ? "Active"
        : "activate";

    if (
      !window.confirm(
        isBn
          ? `আপনি কি এই Agent-কে ${action} করতে চান?`
          : `Are you sure you want to ${action} this agent?`,
      )
    ) {
      return;
    }

    setUpdatingId(agent.id);
    setError("");
    setSuccess("");

    try {
      await updateAgentStatus(agent.id, !agent.is_active);

      setSuccess(
        isBn
          ? "Agent-এর Status পরিবর্তন হয়েছে"
          : "Agent status updated successfully",
      );

      await loadAgents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Status পরিবর্তন করা যায়নি"
            : "Could not update status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(agent: SalesAgent) {
    const confirmed = window.confirm(
      isBn
        ? `আপনি কি ${agent.full_name}-কে Delete করতে চান? এই কাজটি ফেরত নেওয়া যাবে না।`
        : `Delete ${agent.full_name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(agent.id);
    setError("");
    setSuccess("");

    try {
      await deleteAgent(agent.id);

      setSuccess(
        isBn ? "Agent Delete করা হয়েছে" : "Agent deleted successfully",
      );

      if (editingId === agent.id) resetForm();

      await loadAgents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Agent Delete করা যায়নি"
            : "Could not delete agent",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = agents.filter((agent) => agent.is_active).length;
  const inactiveCount = agents.length - activeCount;

  return (
    <div className="min-h-screen bg-[#fffcf3] text-[#292319]">
      <header className="sticky top-0 z-30 border-b border-[#ebd69b] bg-gradient-to-r from-[#f5b91b] to-[#ffe9a6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Circle Network"
              width={100}
              height={55}
              priority
              className="h-11 w-auto object-contain"
            />
            <span className="text-lg font-extrabold sm:text-xl">
              Circle <span className="text-[#805900]">Network</span>
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-[#292319]/20 bg-white/60 px-4 py-2 text-sm font-bold transition hover:bg-white"
          >
            ← {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#a47712]">
            {isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {isBn ? "Sales Agent Management" : "Sales Agent Management"}
          </h1>

          <p className="mt-2 text-[#756b58]">
            {isBn
              ? "Sales Agent তৈরি, তথ্য পরিবর্তন এবং Account পরিচালনা করুন।"
              : "Create, edit and manage sales agent accounts."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "মোট Agent" : "Total Agents"}
            </p>
            <p className="mt-2 text-3xl font-extrabold">{agents.length}</p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "Active Agent" : "Active Agents"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "Inactive Agent" : "Inactive Agents"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-600">
              {inactiveCount}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">
              {editingId !== null
                ? isBn
                  ? "Agent-এর তথ্য Edit করুন"
                  : "Edit Sales Agent"
                : isBn
                  ? "নতুন Sales Agent তৈরি করুন"
                  : "Create New Sales Agent"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#ebd69b] px-4 py-2 text-sm font-bold hover:bg-[#fff8e7]"
              >
                {isBn ? "Cancel Edit" : "Cancel Edit"}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">
                {isBn ? "পূর্ণ নাম" : "Full Name"}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isBn ? "Agent-এর নাম" : "Agent full name"}
                className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3"
              />
            </div>

            {editingId === null && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  {isBn ? "Password" : "Password"}
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isBn
                      ? "কমপক্ষে ১২ অক্ষরের Password"
                      : "Minimum 12 characters"
                  }
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3"
                />
                <p className="mt-2 text-xs text-[#756b58]">
                  {isBn
                    ? "Password কমপক্ষে ১২ অক্ষরের হতে হবে।"
                    : "Password must contain at least 12 characters."}
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#f5b91b] px-6 py-3 font-extrabold text-[#292319] transition hover:bg-[#e9a900] disabled:opacity-60"
              >
                {saving
                  ? isBn
                    ? "অপেক্ষা করুন..."
                    : "Please wait..."
                  : editingId !== null
                    ? isBn
                      ? "তথ্য Update করুন"
                      : "Update Agent"
                    : isBn
                      ? "Agent তৈরি করুন"
                      : "Create Agent"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-sm">
          <div className="border-b border-[#ebd69b] p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">
              {isBn ? "Sales Agent তালিকা" : "Sales Agent List"}
            </h2>
            <p className="mt-1 text-sm text-[#756b58]">
              {isBn
                ? "সব Agent-এর Account পরিচালনা করুন।"
                : "Manage all sales agent accounts."}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-[#756b58]">
              {isBn ? "লোড হচ্ছে..." : "Loading agents..."}
            </div>
          ) : agents.length === 0 ? (
            <div className="p-10 text-center text-[#756b58]">
              {isBn
                ? "কোনো Sales Agent পাওয়া যায়নি।"
                : "No sales agents found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">{isBn ? "নাম" : "Name"}</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">{isBn ? "Status" : "Status"}</th>
                    <th className="px-5 py-4">
                      {isBn ? "কার্যক্রম" : "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f2e6c5]">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-bold">#{agent.id}</td>

                      <td className="px-5 py-4 font-semibold">
                        {agent.full_name}
                      </td>

                      <td className="px-5 py-4">{agent.email}</td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            agent.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {agent.is_active
                            ? isBn
                              ? "Active"
                              : "Active"
                            : isBn
                              ? "Inactive"
                              : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(agent)}
                            className="rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold hover:bg-[#fff3cf]"
                          >
                            {isBn ? "Edit" : "Edit"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusToggle(agent)}
                            disabled={
                              updatingId === agent.id || deletingId === agent.id
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                              agent.is_active
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {updatingId === agent.id
                              ? isBn
                                ? "অপেক্ষা..."
                                : "Updating..."
                              : agent.is_active
                                ? isBn
                                  ? "Deactivate"
                                  : "Deactivate"
                                : isBn
                                  ? "Activate"
                                  : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(agent)}
                            disabled={
                              deletingId === agent.id || updatingId === agent.id
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId === agent.id
                              ? isBn
                                ? "Deleting..."
                                : "Deleting..."
                              : isBn
                                ? "Delete"
                                : "Delete"}
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

      <footer className="mt-10 border-t border-[#ebd69b] py-6 text-center text-sm text-[#756b58]">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </div>
  );
}
