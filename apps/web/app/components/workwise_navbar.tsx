"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppUser } from "../hooks/use-app-user";
import { ThemeToggle } from "./theme_toggle";

const NavbarProfile = () => {
  const [open, setOpen] = useState(false);
  const { user, isLoading } = useAppUser();

  if (isLoading) return null;

  if (!user) {
    return (
      <Link
        href="/api/auth/login"
        className="rounded-full bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:opacity-80 transition-opacity"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {'picture' in user && user.picture ? (
          <img
            src={user.picture}
            alt={user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
            {(user.name || "U")[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1e] shadow-lg py-1">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="/api/auth/logout"
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign out
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export const WorkWiseNavbar = () => {
  return (
    <nav className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#0f0f12]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/favicon.ico" className="h-5" alt="WorkWise" />
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            WorkWise
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NavbarProfile />
        </div>
      </div>
    </nav>
  );
};
