"use client";

import Image from "next/image";
import Link from "next/link";

export default function WaitlistConfirmedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 text-center">
      <main className="flex flex-col items-center justify-center max-w-2xl w-full">
        <Image
          src="/logos/dark_flat.png" // Assuming the same logo is appropriate here
          alt="Koru Logo"
          width={150} // Slightly smaller logo for this page
          height={150}
          priority
          className="mb-8"
        />

        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-400">
          You&apos;re In!
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Your email has been confirmed, and you&apos;re officially on the Koru
          waitlist. We&apos;re excited to have you and will keep you updated on
          our launch!
        </p>

        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300"
        >
          Back to Homepage
        </Link>

        <footer className="mt-20 text-gray-500">
          <p>&copy; {new Date().getFullYear()} Koru. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
