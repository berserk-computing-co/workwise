"use client";

import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const NavbarProfile = () => {
  const { data } = useSession();
  console.log("data", data);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button>Profile</Button>
      <Drawer isOpen={isOpen}></Drawer>
    </div>
  );
};

export const WorkWiseNavbar = () => {
  return (
    <SessionProvider>
      <Navbar fluid rounded>
        <NavbarBrand as={Link} href="https://flowbite-react.com">
          <img
            src="/workwise.png"
            className="mr-3 h-6 sm:h-9"
            alt="WorkWise Logo"
          />
        </NavbarBrand>
        <NavbarToggle />
        <NavbarCollapse>
          <NavbarLink href="/">Home</NavbarLink>
          <NavbarLink as={Link} href="#">
            About
          </NavbarLink>
          <NavbarLink href="/bids">Bids</NavbarLink>
          <NavbarLink href="#">Contact</NavbarLink>
          <NavbarProfile />
        </NavbarCollapse>
      </Navbar>
    </SessionProvider>
  );
};
