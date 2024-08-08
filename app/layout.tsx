import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { WorkWiseNavbar } from "./components/workwise_navbar";
import { Footer } from "flowbite-react";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkWiseNavbar />
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-blue-200">
          <div className="z-10 w-full max-w-5xl items-center justify-between font-mono">
            {children}
          </div>
        </main>
        <Footer container>
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
      </body>
    </html>
  );
}
