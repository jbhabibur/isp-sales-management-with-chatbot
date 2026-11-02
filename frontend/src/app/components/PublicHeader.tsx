"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";

import { getStoredUser, logout, type AuthUser } from "@/lib/api";

export default function PublicHeader() {
  const { language } = useLanguage();

  const text = {
    bn: {
      home: "হোম",
      packages: "ইন্টারনেট প্যাকেজ",
      login: "লগইন",
      dashboard: "ড্যাশবোর্ড",
      logout: "লগআউট",
      administrator: "অ্যাডমিন",
      salesAgent: "সেলস এজেন্ট",
    },
    en: {
      home: "Home",
      packages: "Internet Packages",
      login: "Login",
      dashboard: "Dashboard",
      logout: "Logout",
      administrator: "Administrator",
      salesAgent: "Sales Agent",
    },
  };

  const t = text[language];

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Read user directly from localStorage (No API Request)
  useEffect(() => {
    const storedUser = getStoredUser();

    setUser(storedUser);
    setAuthChecked(true);
  }, []);

  const userName = user?.full_name || "User";
  const initials = userName.trim().charAt(0).toUpperCase();

  const dashboardLink =
    user?.role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard";

  // Logout without redirecting from current page
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsProfileOpen(false);
  };

  return (
    <header className="border-b border-border bg-[#fff8e7]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/logo.png"
            alt="Circle Network Logo"
            width={160}
            height={60}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation */}
        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
          <Link href="/" className="hover:text-primary">
            {t.home}
          </Link>

          <Link href="/packages" className="hover:text-primary">
            {t.packages}
          </Link>
        </nav>

        {/* Login / Profile and Language */}
        <div className="ml-auto flex items-center gap-4">
          {!authChecked ? (
            <div className="h-10 w-24 animate-pulse rounded-xl bg-[#f3eadb]" />
          ) : user ? (
            <div className="relative">
              {/* Profile Button */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-label="Open profile menu"
                className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all duration-200 ${
                  isProfileOpen
                    ? "border-[#E19112] bg-white shadow-md"
                    : "border-[#ead9b8] bg-white/70 hover:border-[#E19112] hover:bg-white hover:shadow-md"
                }`}
              >
                {/* Avatar */}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E19112] to-[#bd760b] text-sm font-bold text-white shadow-sm">
                  {initials}
                </span>

                {/* Name */}
                <span className="hidden text-left sm:block">
                  <span className="block max-w-28 truncate text-sm font-semibold text-gray-800">
                    {userName}
                  </span>

                  <span className="block text-[11px] text-gray-500">
                    {user.role === "ADMIN" ? t.administrator : t.salesAgent}
                  </span>
                </span>

                {/* Chevron */}
                <svg
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />

                  <div className="absolute right-0 z-50 mt-3 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden rounded-2xl border border-[#f0e5d1] bg-white shadow-xl shadow-gray-900/10">
                    {/* User Information */}
                    <div className="border-b border-[#f3eadb] bg-[#fffaf0] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E19112] to-[#bd760b] text-lg font-bold text-white shadow-sm">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800">
                            {userName}
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2dfbd] bg-[#fff3dc] px-2.5 py-1 text-[11px] font-semibold text-[#a96708]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E19112]" />

                          {user.role === "ADMIN"
                            ? t.administrator
                            : t.salesAgent}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {/* Dashboard */}
                      <Link
                        href={dashboardLink}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-[#fff6e6] hover:text-[#c17a0b]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff3dc] text-[#c17a0b]">
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
                              d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v4h8V3h-8Z"
                            />
                          </svg>
                        </span>

                        <span className="flex-1">{t.dashboard}</span>

                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="m9 18 6-6-6-6"
                          />
                        </svg>
                      </Link>

                      <div className="my-1 border-t border-gray-100" />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
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
                              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 15l3-3m0 0-3-3m3 3H9"
                            />
                          </svg>
                        </span>

                        {t.logout}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Login Button */
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E19112] to-[#d1840d] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#E19112]/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#d1840d] hover:to-[#b97009] hover:shadow-lg hover:shadow-[#E19112]/30 active:translate-y-0"
            >
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 15l3-3m0 0-3-3m3 3H9"
                />
              </svg>

              {t.login}
            </Link>
          )}

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
