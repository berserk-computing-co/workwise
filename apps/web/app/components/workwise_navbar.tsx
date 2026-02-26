"use client";

import React, { useState } from "react";
import {
  Avatar,
  Drawer,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Sidebar,
} from "flowbite-react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ThemeToggle } from "./theme_toggle";

const NavbarProfile = () => {
  const [open, setOpen] = useState(false);
  const { user, isLoading } = useUser();

  if (isLoading) return null;

  if (!user) {
    return (
      <Link
        href="/api/auth/login"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div>
      <Avatar
        rounded
        img={user.picture || undefined}
        alt={user.name || "User"}
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      />
      <Drawer position="right" open={open} onClose={() => setOpen(false)}>
        <Drawer.Header title={user.name || "Profile"} />
        <Drawer.Items>
          <Sidebar
            aria-label="Profile navigation"
            className="[&>div]:bg-transparent [&>div]:p-0"
          >
            <div className="flex h-full flex-col justify-between py-2">
              <Sidebar.Items>
                <Sidebar.ItemGroup>
                  <Sidebar.Item href="/projects">Dashboard</Sidebar.Item>
                  <Sidebar.Item href="/api/auth/logout">Sign Out</Sidebar.Item>
                </Sidebar.ItemGroup>
              </Sidebar.Items>
            </div>
          </Sidebar>
        </Drawer.Items>
      </Drawer>
    </div>
  );
};

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
        <ThemeToggle />
        <NavbarProfile />
        <Navbar.Toggle />
      </div>
    </Navbar>
  );
};
