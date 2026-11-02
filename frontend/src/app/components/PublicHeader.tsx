"use client";

import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";

export default function PublicHeader() {
  const { language } = useLanguage();

  const text = {
    bn: {
      home: "হোম",
      packages: "ইন্টারনেট প্যাকেজ",
      login: "লগইন",
    },
    en: {
      home: "Home",
      packages: "Internet Packages",
      login: "Login",
    },
  };

  const t = text[language];

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

        {/* Login and Language */}
        <div className="ml-auto flex items-center gap-5">
          <Link
            href="/login"
            className="rounded-lg bg-[#E19112] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c77e0d]"
          >
            {t.login}
          </Link>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
