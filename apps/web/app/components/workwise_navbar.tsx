"use client";
/* global window */

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
} from "flowbite-react";
import Link from "next/link";
import { ThemeToggle } from "./theme_toggle";

export const WorkWiseNavbar = () => {
  return (
    <Navbar fluid rounded>
      <NavbarBrand as={Link} href="/">
        <img
          src="/workwise.png"
          className="mr-3 h-6 sm:h-9"
          alt="WorkWise Logo"
        />
      </NavbarBrand>
      <NavbarCollapse>
        <NavbarLink href="/">Home</NavbarLink>
      </NavbarCollapse>
      <div className="flex items-center gap-2 md:order-2">
        <Link
          href="/join"
          className="hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors"
        >
          Join as a contractor
        </Link>
        <ThemeToggle />
        {/* TODO: Auth0 profile */}
        <Navbar.Toggle />
      </div>
    </Navbar>
  );
};
