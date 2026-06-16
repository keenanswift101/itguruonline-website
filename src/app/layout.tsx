import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/ui/FloatingActions";
import { QuestionTab } from "@/components/ui/QuestionTab";
import { DomainPromo } from "@/components/ui/DomainPromo";
import { CookieConsent } from "@/components/ui/CookieConsent";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru-online.netlify.app"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru-online.netlify.app",
    siteName: "IT-Guru Online",
    title: "IT-Guru Online | IT Solutions & Support — Kuils River",
    description:
      "Professional IT support, domain registration, web hosting, and network solutions in Kuils River, South Africa.",
    images: [
      {
        url: "/favicon.png",
        alt: "IT-Guru Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IT-Guru Online | IT Solutions & Support — Kuils River",
    description:
      "Professional IT support, domain registration, web hosting, and network solutions in South Africa.",
    images: ["/favicon.png"],
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
    <html lang="en" className={inter.variable} data-theme="dark">
      <body className="min-h-screen flex flex-col antialiased overflow-x-hidden">
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <FloatingActions />
        <QuestionTab />
        <DomainPromo />
        <CookieConsent />
      </body>
    </html>
  );
}
