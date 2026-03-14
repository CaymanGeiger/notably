import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Careers | Notably",
  description: "Learn how Notably teams work and how to express interest in future roles.",
};

const STATUS_DATE = "March 7, 2026";

export default async function CareersPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();
  const accountLabel = user ? (user.name?.trim() || user.email.split("@")[0] || "Account") : undefined;

  return (
    <main className="home-page info-page">
      <PublicNav isSignedIn={Boolean(user)} initialTheme={initialTheme} accountLabel={accountLabel} />

      <section className="home-section reveal info-hero">
        <div className="section-head">
          <p className="eyebrow">Company</p>
          <h1>Careers at Notably</h1>
          <p className="info-subtitle">
            We are building collaborative notes infrastructure with strict permission controls and
            realtime reliability.
          </p>
        </div>
      </section>

      <section className="info-grid reveal" aria-label="Careers sections">
        <article className="panel info-card">
          <h2>How we work</h2>
          <ul className="bullet-list">
            <li>Product and engineering collaborate closely with direct user feedback loops.</li>
            <li>We optimize for security, clarity, and reliable collaboration at scale.</li>
            <li>Small teams own features end-to-end, from API design to UI polish.</li>
          </ul>
        </article>

        <article className="panel info-card">
          <h2>What we value</h2>
          <ul className="bullet-list">
            <li>Clear communication and thoughtful execution.</li>
            <li>Pragmatic decisions grounded in real product constraints.</li>
            <li>High standards for maintainability and user trust.</li>
          </ul>
        </article>

        <article className="panel info-card">
          <h2>Current openings</h2>
          <p className="info-meta">Status as of {STATUS_DATE}: no public openings posted.</p>
          <p>
            If you want to be considered for future roles, send a short intro and relevant work
            samples to{" "}
            <a href="mailto:partners@caymangeiger.com">partners@caymangeiger.com</a>.
          </p>
          <p className="info-link-line">
            For product support, use <Link href="/contact">the contact page</Link>.
          </p>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
