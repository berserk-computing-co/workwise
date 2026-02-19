import React from "react";
import { WorkWiseNavbar } from "@/app/components/workwise_navbar";
import { Footer } from "flowbite-react";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkWiseNavbar />
      <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-blue-200 dark:bg-slate-900">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono">
          {children}
        </div>
      </main>
      <Footer container className="dark:bg-slate-900">
        <div className="w-full text-center">
          <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
            <Footer.Brand
              href="https://api.workwise.live"
              src="/workwise.png"
              alt="WorkWise Logo"
              name="WorkWise"
            />
            <Footer.LinkGroup>
              <Footer.Link href="#">About</Footer.Link>
              <Footer.Link href="#">Privacy Policy</Footer.Link>
              <Footer.Link href="#">Licensing</Footer.Link>
              <Footer.Link href="#">Contact</Footer.Link>
            </Footer.LinkGroup>
          </div>
          <Footer.Divider />
          <Footer.Copyright href="#" by="Berserk Computing" year={2024} />
        </div>
      </Footer>
    </>
  );
}
