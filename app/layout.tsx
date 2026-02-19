import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth_provider";
import { ThemeProvider } from "./lib/theme/context";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
