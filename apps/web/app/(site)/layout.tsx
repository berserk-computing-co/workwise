import React from "react";
import { WorkWiseNavbar } from "@/app/components/workwise_navbar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkWiseNavbar />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <img src="/workwise.png" className="h-5" alt="WorkWise" />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              WorkWise
            </span>
          </div>
          <p>&copy; {new Date().getFullYear()} Berserk Computing</p>
        </div>
      </footer>
    </>
  );
}
