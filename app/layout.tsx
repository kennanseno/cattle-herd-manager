import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/AppShell";
import type { FarmSettings } from "@/types";
import { getSettings } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import pkg from "../package.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cattle Herd Manager",
  description: "Thoughtful tools for cattle records, breeding, health, and farm finances.",
};

export const dynamic = "force-dynamic";

const emptySettings: FarmSettings = {
  farmName: "",
  ownerName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = emptySettings;
  if (getSupabasePublicConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") {
      throw new Error(`Could not load the signed-in user: ${error.message}`);
    }
    if (data.user) settings = await getSettings();
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full bg-background">
        <Providers>
        <AppShell settings={settings} version={pkg.version} authEnabled={Boolean(getSupabasePublicConfig())}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
