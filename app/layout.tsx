import type { Metadata } from "next";
import { abcDiatype } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

// Absolute base for OG/canonical URLs. Prefer an explicit site URL, fall back to
// the URL Vercel injects at build/runtime, then localhost for dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const title = "Wonder Test";
const description =
  "Where creators go from a video file to live on Wonder TV — upload, add metadata, preview, and publish.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Wonder Test",
  },
  description,
  applicationName: "Wonder Test",
  openGraph: {
    type: "website",
    siteName: "Wonder Test",
    title,
    description,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 2400,
        height: 1260,
        alt: "Wonder TV — Discover: a dark gallery of published films with mood tags.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={abcDiatype.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          value={{ light: "light", dark: "dark" }}
          disableTransitionOnChange={false}
        >
          {/* Header + nav persist across every route; pages own their <main>. */}
          <SiteHeader />
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
