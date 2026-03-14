import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Contact | Notably",
  description: "Contact Notably for privacy, support, and partnership requests.",
};

export default async function ContactPage() {
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
          <h1>Contact Notably</h1>
          <p className="info-subtitle">
            Route your message to the right team and we will get back to you as quickly as possible.
          </p>
        </div>
      </section>

      <section className="contact-grid reveal" aria-label="Contact channels">
        <article className="panel info-card">
          <h2>Privacy</h2>
          <p>Questions about personal data, access requests, or deletion requests.</p>
          <p className="info-link-line">
            <a href="mailto:privacy@caymangeiger.com">privacy@caymangeiger.com</a>
          </p>
        </article>

        <article className="panel info-card">
          <h2>Support</h2>
          <p>Help with account access, workspace behavior, and realtime collaboration issues.</p>
          <p className="info-link-line">
            <a href="mailto:support@caymangeiger.com">support@caymangeiger.com</a>
          </p>
        </article>

        <article className="panel info-card">
          <h2>Partnerships</h2>
          <p>Integration opportunities, strategic partnerships, and business development.</p>
          <p className="info-link-line">
            <a href="mailto:partners@caymangeiger.com">partners@caymangeiger.com</a>
          </p>
        </article>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <p className="eyebrow">Response Times</p>
          <h2>What to expect</h2>
        </div>
        <ul className="bullet-list">
          <li>Privacy inquiries: typically within 2 business days.</li>
          <li>Support inquiries: typically within 1 business day.</li>
          <li>Partnership inquiries: typically within 3 business days.</li>
        </ul>
      </section>

      <PublicFooter />
    </main>
  );
}
