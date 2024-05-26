import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WorkWiseNavbar } from "./components/workwise_navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorkWise",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkWiseNavbar />
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <div className="z-10 w-full max-w-5xl items-center justify-between font-mono">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
