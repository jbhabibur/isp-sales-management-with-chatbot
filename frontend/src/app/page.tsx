"use client";

import Image from "next/image";
import Link from "next/link";
import PublicHeader from "./components/PublicHeader";
import { useLanguage } from "./components/LanguageProvider";

export default function Home() {
  const { language } = useLanguage();

  const content = {
    bn: {
      packages: "ইন্টারনেট প্যাকেজ দেখুন",
      connection: "নতুন সংযোগ নিন",
      bannerAlt: "সার্কেল নেটওয়ার্ক - বিশ্বের সাথে সংযুক্ত থাকুন",
    },
    en: {
      packages: "View Internet Packages",
      connection: "Request New Connection",
      bannerAlt: "Circle Network - Stay Connected to the World",
    },
  };

  const t = content[language];

  const bannerImage =
    language === "bn"
      ? "/images/circle-network-banner-bn.png"
      : "/images/circle-network-banner-en.webp";

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-[#fff8e7]">
        {/* Language Based Banner */}
        <section className="w-full">
          <Image
            src={bannerImage}
            alt={t.bannerAlt}
            width={1822}
            height={768}
            priority
            className="h-auto w-full"
          />
        </section>

        {/* Main Actions */}
        <section className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4 px-6 py-10">
          <Link
            href="/packages"
            className="rounded-lg bg-primary px-7 py-3 font-bold text-primary-foreground shadow-md transition hover:opacity-80"
          >
            {t.packages}
          </Link>

          <Link
            href="/chatbot"
            className="rounded-lg border-2 border-primary bg-white px-7 py-3 font-bold text-foreground transition hover:bg-secondary"
          >
            {t.connection}
          </Link>
        </section>
      </main>

      <footer className="border-t border-border bg-[#fff3cf] px-6 py-6 text-center text-sm text-foreground">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </>
  );
}
