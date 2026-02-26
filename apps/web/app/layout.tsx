import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Auth0Provider } from "./auth0-provider";
import { ThemeProvider } from "./lib/theme/context";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Auth0Provider>
          <ThemeProvider>{children}</ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
