import localFont from "next/font/local";

/**
 * ABC Diatype — the single typeface the whole system is built on.
 * The source site only ever uses the Regular (400) weight, including for
 * headings. Medium/Light are wired up here for optional emphasis, but the
 * components deliberately stick to 400 to stay faithful to the reference.
 *
 * NOTE: these are the *trial* weights shipped for local development. Swap in
 * the licensed webfonts (ideally .woff2) before shipping to production.
 */
export const abcDiatype = localFont({
  variable: "--font-abc",
  display: "swap",
  src: [
    { path: "../public/fonts/ABCDiatype-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/ABCDiatype-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/ABCDiatype-Medium.otf", weight: "500", style: "normal" },
  ],
  fallback: ["Helvetica", "Arial", "sans-serif"],
});
