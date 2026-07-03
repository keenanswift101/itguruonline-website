import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/ui/FloatingActions";
import { QuestionTab } from "@/components/ui/QuestionTab";
import { DomainPromo } from "@/components/ui/DomainPromo";
import { CookieConsent } from "@/components/ui/CookieConsent";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
      <QuestionTab />
      <DomainPromo />
      <CookieConsent />
    </div>
  );
}
