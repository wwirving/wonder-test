import type { Metadata } from "next";
import { abcDiatype } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase / openGraph to be added once a deployed (Vercel) URL exists.
  title: {
    default: "Wonder Test",
    template: "%s · Wonder Test",
  },
  description:
    "Where creators go from a video file to live on Wonder TV — upload, add metadata, preview, and publish.",
  applicationName: "Wonder Test",
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
