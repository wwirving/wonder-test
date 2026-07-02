export function SiteFooter() {
  return (
    <footer className="order-[9999] mt-auto flex w-full flex-wrap px-5 pb-4 text-small text-muted">
      <div className="w-1/3">
        <span>© 2016–2025</span>
      </div>
      <ul className="flex w-2/3 justify-end pl-4">
        <li className="mr-8 last:mr-0">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-subtle"
          >
            @rafacobiella
          </a>
        </li>
        <li className="mr-8 last:mr-0">
          <a
            href="mailto:hello@example.com"
            className="transition-colors hover:text-subtle"
          >
            Email
          </a>
        </li>
      </ul>
    </footer>
  );
}
