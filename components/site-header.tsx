import Link from "next/link";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    // pointer-events-none lets clicks fall through the header bar's empty
    // space to the content beneath; interactive children re-enable them.
    <header className="pointer-events-none fixed inset-x-0 top-5 z-100 flex items-start px-5 text-small select-none">
      {/* Left cluster: logo on top, primary nav in a row underneath. */}
      <div className="flex flex-col gap-2">
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

        <Nav />
      </div>

      <ThemeToggle className="pointer-events-auto absolute right-5 top-0" />
    </header>
  );
}
