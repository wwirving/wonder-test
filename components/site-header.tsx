import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    // pointer-events-none lets clicks fall through the header bar's empty
    // space to the content beneath; interactive children re-enable them.
    <header className="pointer-events-none fixed inset-x-0 top-5 z-100 flex h-10 items-center px-5 text-small select-none">
      <h1 className="logo">
        <Link
          href="/"
          title="Wonder TV"
          aria-label="Wonder TV, home"
          className="pointer-events-auto block text-foreground"
        >
          Wonder&nbsp;TV
        </Link>
      </h1>

      <ThemeToggle className="pointer-events-auto absolute right-5" />
    </header>
  );
}
