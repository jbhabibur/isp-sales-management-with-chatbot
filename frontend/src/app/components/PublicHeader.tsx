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
      chatbot: "চ্যাটবট",
    },
    en: {
      home: "Home",
      packages: "Internet Packages",
      chatbot: "Chatbot",
    },
  };

  const t = text[language];

  return (
    <header className="border-b border-border bg-[#fff8e7]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="Circle Network Logo"
            width={160}
            height={60}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
          <Link href="/" className="hover:text-primary">
            {t.home}
          </Link>

          <Link href="/packages" className="hover:text-primary">
            {t.packages}
          </Link>

          <Link href="/chatbot" className="hover:text-primary">
            {t.chatbot}
          </Link>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
