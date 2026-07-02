import { Gallery } from "@/components/gallery";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <main className="page-home flex min-h-screen flex-col pt-[var(--margin-main-top)]">
      <Gallery />
      <SiteFooter />
    </main>
  );
}
