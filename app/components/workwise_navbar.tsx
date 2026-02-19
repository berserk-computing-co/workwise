"use client";
/* global window */

import React, { useCallback, useState } from "react";
import {
  Avatar,
  Drawer,
  Dropdown,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Sidebar,
} from "flowbite-react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { useStytch, useStytchSession } from "@stytch/nextjs";
import { ThemeToggle } from "./theme_toggle";

const NavbarProfile = () => {
  const [open, setOpen] = useState(false);
  const client = useStytch();
  const session = useStytchSession();

  const logout = useCallback(() => {
    if (session.session) {
      client.session.revoke();
    }
  }, [client, session]);


  return (session.session ? (
    <div>
      <Avatar rounded onClick={() => setOpen(true)} />
      <Drawer position="right" open={open} onClose={() => setOpen(false)}>
        <Drawer.Header title="Profile" />
        <Drawer.Items>
          <Sidebar
            aria-label="Sidebar with multi-level dropdown example"
            className="[&>div]:bg-transparent [&>div]:p-0"
          >
            <div className="flex h-full flex-col justify-between py-2">
              <div>
                <Sidebar.Items>
                  <Sidebar.ItemGroup>
                    <Sidebar.Item href="/bids">Dashboard</Sidebar.Item>
                    <Sidebar.Item onClick={logout}>Sign Out</Sidebar.Item>
                  </Sidebar.ItemGroup>
                </Sidebar.Items>
              </div>
            </div>
          </Sidebar>
        </Drawer.Items>
      </Drawer>
    </div>
  ) : (
    <Dropdown label="Login" inline>
      <Dropdown.Item as={Link} href="/login?type=contractor">
        Contractor Login
      </Dropdown.Item>
      <Dropdown.Item as={Link} href="/login?type=homeowner">
        Homeowner Login
      </Dropdown.Item>
    </Dropdown>
  ));
};

export const WorkWiseNavbar = () => {
  return (
    <SessionProvider>
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
          <NavbarProfile />
          <Navbar.Toggle />
        </div>
      </Navbar>
    </SessionProvider>
  );
};
