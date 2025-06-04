"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-black/80 fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-neutral-800">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-start">
        <Link href="/app" className="flex items-center">
          <Image
            src="/logos/dark_flat.png"
            alt="Koru Logo"
            width={50}
            height={50}
          />
        </Link>
      </div>
    </header>
  );
}
