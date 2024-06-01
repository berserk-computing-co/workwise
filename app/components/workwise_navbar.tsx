"use client";
/* global window */

import React from "react";
import {
  Avatar,
  Drawer,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Sidebar,
} from "flowbite-react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const NavbarProfile = () => {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  return (
    data && (
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
                      <Sidebar.Item
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Sign Out
                      </Sidebar.Item>
                    </Sidebar.ItemGroup>
                  </Sidebar.Items>
                </div>
              </div>
            </Sidebar>
          </Drawer.Items>
        </Drawer>
      </div>
    )
  );
};

export const WorkWiseNavbar = () => {
  const homePage = window.location.pathname.split("").length <= 1;
  console.log("homePage", homePage);
  return (
    <SessionProvider>
      <Navbar fluid rounded>
        <NavbarBrand as={Link} href="http://api.workwise.live">
          <img
            src="/workwise.png"
            className="mr-3 h-6 sm:h-9"
            alt="WorkWise Logo"
          />
        </NavbarBrand>
        <NavbarCollapse>
          <NavbarLink href="/">Home</NavbarLink>
          {homePage && (
            <NavbarLink as={Link} href="#">
              About
            </NavbarLink>
          )}
          <NavbarLink href="/bids">Bids</NavbarLink>
        </NavbarCollapse>
        <div className="flex md:order-2">
          <NavbarProfile />
          <Navbar.Toggle />
        </div>
      </Navbar>
    </SessionProvider>
  );
};
