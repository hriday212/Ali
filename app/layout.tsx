import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { TopHeader } from "@/components/layout/TopHeader";
import Dock from "@/components/layout/Dock";
import ShapeGrid from "@/components/effects/ShapeGrid";
import { AuthProvider } from "@/lib/authStore";

export const metadata: Metadata = {
  title: "Clypso | Monetization Protocol",
  description: "Track and monetize your social media clips across YT, IG, and TikTok.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#020617] text-slate-100 font-['Plus_Jakarta_Sans'] relative overflow-x-hidden">
        <AuthProvider>
          <ShapeGrid 
            className="fixed inset-0 -z-10"
            direction="diagonal"
            speed={0.5}
            squareSize={40}
            borderColor="#1e293b"
            hoverFillColor="#334155"
            shape="square"
            hoverTrailAmount={2}
          />
          <div className="flex flex-col min-h-screen">
            <TopHeader />
            <main className="flex-1 pt-24 pb-32">
              <div className="max-w-[1400px] mx-auto px-8">
                {children}
              </div>
            </main>
            <Dock />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
