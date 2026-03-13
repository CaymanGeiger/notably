import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="site-footer reveal" aria-label="Notably footer">
      <div className="site-footer-brand">
        <p className="site-footer-title">© 2026 Notably</p>
        <p className="site-footer-tagline">Clear notes, shared instantly.</p>
      </div>
      <nav className="site-footer-links" aria-label="Footer links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/careers">Careers</Link>
      </nav>
    </footer>
  );
}
