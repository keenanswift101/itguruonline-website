import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "IT-Guru Online | IT Solutions & Support — Kuils River, Cape Town",
    template: "%s | IT-Guru Online",
  },
  description:
    "Professional IT support, domain registration, web hosting, and network solutions in Kuils River, South Africa. Remote support, hardware procurement, and web design services.",
  keywords: [
    "IT support",
    "domain registration",
    "web hosting",
    "Kuils River",
    "Cape Town",
    "South Africa",
    "network solutions",
    "remote support",
    "web design",
    ".co.za domain",
  ],
  authors: [{ name: "IT-Guru Online" }],
  creator: "Swift Designz",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru.online"),
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru.online",
    siteName: "IT-Guru Online",
    title: "IT-Guru Online | IT Solutions & Support — Kuils River",
    description:
      "Professional IT support, domain registration, web hosting, and network solutions in Kuils River, South Africa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT-Guru Online | IT Solutions & Support — Kuils River",
    description:
      "Professional IT support, domain registration, web hosting, and network solutions in South Africa.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
