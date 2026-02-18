"use client";
/* global window */

import React, { useCallback, useState } from "react";
import {
  Avatar,
  Drawer,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Sidebar,
} from "flowbite-react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { useStytch, useStytchSession } from "@stytch/nextjs";

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
    <Link href="/login">
      <button className="text-slate-700">Login</button>
    </Link>
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
        <div className="flex md:order-2">
          <NavbarProfile />
          <Navbar.Toggle />
        </div>
      </Navbar>
    </SessionProvider>
  );
};
