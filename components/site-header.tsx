import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** The circular "R" monogram from rcobiella.net (path lifted verbatim). */
function Monogram() {
  return (
    <svg
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      aria-hidden
    >
      <path
        d="M0 12.5C0 5.60856 5.60856 0 12.5 0C19.3914 0 25 5.60856 25 12.5C25 19.3914 19.3905 25 12.5 25C5.60951 25 0 19.3905 0 12.5ZM23.3336 12.5C23.3336 6.50601 18.494 1.60218 12.5009 1.60218C6.5079 1.60218 1.66641 6.50601 1.66641 12.5C1.66641 18.494 6.50601 23.394 12.5 23.394C18.494 23.394 23.3326 18.493 23.3326 12.5H23.3336ZM8.33302 6.31329H13.6232C16.0907 6.31329 17.469 7.7237 17.469 9.61967C17.469 11.3824 16.3798 12.4726 15.0336 12.6644C16.6396 12.6965 17.3094 13.3058 17.3094 15.2292V18.3693H15.3539V15.1923C15.3539 14.1664 14.8088 13.6535 13.6232 13.6535H10.2885V18.3646H8.33302V6.31329ZM12.8202 12.1155C14.4545 12.1155 15.5126 11.442 15.5126 10.0637C15.5126 8.39726 14.5188 7.91641 12.8202 7.91641H10.2885V12.1155H12.8202Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    // pointer-events-none lets clicks fall through the header bar's empty
    // space to the content beneath; interactive children re-enable them.
    <header className="pointer-events-none fixed inset-x-0 top-5 z-100 flex h-10 items-center px-5 text-small select-none">
      <h1 className="logo">
        <span className="sr-only">Rafa Cobiella</span>
        <Link
          href="/"
          title="Rafa Cobiella"
          aria-label="Home"
          className="pointer-events-auto block text-foreground"
        >
          <Monogram />
        </Link>
      </h1>

      <nav className="pointer-events-auto absolute left-[calc(1.25rem+8.72%)] flex pl-3">
        <a
          href="#"
          aria-current="page"
          className="mr-8 text-subtle transition-colors hover:text-subtle"
        >
          Works
        </a>
        <a
          href="#"
          className="text-muted transition-colors hover:text-subtle"
        >
          Information
        </a>
      </nav>

      <ThemeToggle className="pointer-events-auto absolute right-5" />
    </header>
  );
}
