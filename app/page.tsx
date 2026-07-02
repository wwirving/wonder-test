import { SiteHeader } from "@/components/site-header";
import { Gallery } from "@/components/gallery";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="page-home flex min-h-screen flex-col pt-[var(--margin-main-top)]">
        <Gallery />
        <SiteFooter />
      </main>

      <CookieBanner />
    </>
  );
}
