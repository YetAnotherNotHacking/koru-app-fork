import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";

import "./globals.css";
import Providers from "./providers";
import "@/clients/api";

export const metadata: Metadata = {
  title: "Koru",
};

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html
        lang="en"
        className={`${rubik.variable} ${geistMono.variable} dark`}
      >
        <body className="antialiased dark bg-black text-white min-h-screen">
          {children}
        </body>
      </html>
    </Providers>
  );
}
