"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/lib/api";
import { useLanguage } from "../components/LanguageProvider";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const content = {
    bn: {
      title: "লগইন করুন",
      subtitle: "আপনার অ্যাকাউন্টে প্রবেশ করুন",
      email: "ইমেইল",
      password: "পাসওয়ার্ড",
      button: "লগইন",
      loading: "লগইন হচ্ছে...",
      back: "হোম পেজে ফিরে যান",
      showPassword: "পাসওয়ার্ড দেখুন",
      hidePassword: "পাসওয়ার্ড লুকান",
      failed: "লগইন করা সম্ভব হয়নি। আবার চেষ্টা করুন।",
      unauthorized: "আপনার এই অ্যাকাউন্টে প্রবেশের অনুমতি নেই।",
    },
    en: {
      title: "Login",
      subtitle: "Sign in to your account",
      email: "Email Address",
      password: "Password",
      button: "Login",
      loading: "Logging in...",
      back: "Back to Home",
      showPassword: "Show password",
      hidePassword: "Hide password",
      failed: "Unable to login. Please try again.",
      unauthorized: "You are not authorized to access this account.",
    },
  };

  const t = content[language];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else if (result.user.role === "SALES_AGENT") {
        router.replace("/agent/dashboard");
      } else {
        setError(t.unauthorized);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8e7] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#ebd69b] bg-white p-8 shadow-xl">
        {/* Logo and Heading */}
        <div className="mb-8 text-center">
          <Link href="/" className="flex items-center justify-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Circle Network Logo"
              width={180}
              height={80}
              priority
              className="h-16 w-auto object-contain"
            />

            <span className="text-2xl font-extrabold tracking-tight text-[#292319]">
              Circle <span className="text-[#e9a900]">Network</span>
            </span>
          </Link>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[#f5b91b]" />

          <h1 className="mt-6 text-2xl font-bold text-[#292319]">{t.title}</h1>

          <p className="mt-2 text-sm text-[#756b58]">{t.subtitle}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[#292319]"
            >
              {t.email}
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm outline-none transition focus:border-[#e9a900] focus:ring-2 focus:ring-[#f5b91b]/30"
              placeholder="example@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[#292319]"
            >
              {t.password}
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#e9a900] focus:ring-2 focus:ring-[#f5b91b]/30"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-[#756b58] transition hover:text-[#e9a900] focus:outline-none"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                title={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f5b91b] px-5 py-3 font-bold text-[#292319] shadow-md transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t.loading : t.button}
          </button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[#756b58] transition hover:text-[#292319]"
          >
            ← {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
