import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Terms | Notably",
  description: "Terms that govern use of Notably, including collaboration, access, and account rules.",
};

const EFFECTIVE_DATE = "March 7, 2026";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();
  const accountLabel = user ? (user.name?.trim() || user.email.split("@")[0] || "Account") : undefined;

  return (
    <main className="home-page info-page">
      <PublicNav isSignedIn={Boolean(user)} initialTheme={initialTheme} accountLabel={accountLabel} />

      <section className="home-section reveal info-hero">
        <div className="section-head">
          <p className="eyebrow">Legal</p>
          <h1>Terms of Service</h1>
          <p className="info-subtitle">
            These terms govern your access to and use of Notably, including workspace collaboration,
            note permissions, and realtime editing features.
          </p>
          <p className="info-meta">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <section className="legal-stack reveal" aria-label="Terms sections">
        <article className="legal-section">
          <h2>1. Using Notably</h2>
          <p>
            You must provide accurate account information and keep your credentials secure. You are
            responsible for activity that occurs through your account.
          </p>
        </article>

        <article className="legal-section">
          <h2>2. Workspace and permission model</h2>
          <p>
            Notably uses workspace membership plus note-level OWNER, EDITOR, and VIEWER roles.
            Owners control note access and may invite collaborators. You agree not to bypass or
            attempt to bypass permission controls.
          </p>
        </article>

        <article className="legal-section">
          <h2>3. Acceptable use</h2>
          <ul className="bullet-list">
            <li>Do not use Notably to violate law, infringe rights, or distribute harmful content.</li>
            <li>Do not attempt unauthorized access to data, rooms, APIs, or infrastructure.</li>
            <li>Do not interfere with service performance or security for other users.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>4. Content ownership and license</h2>
          <p>
            You retain ownership of content you create in Notably. You grant us a limited license to
            host, store, process, and transmit that content only as needed to operate and improve the
            service.
          </p>
        </article>

        <article className="legal-section">
          <h2>5. Availability and changes</h2>
          <p>
            We may modify features, APIs, and limits over time. We work to maintain reliable service,
            but uptime and uninterrupted access are not guaranteed.
          </p>
        </article>

        <article className="legal-section">
          <h2>6. Suspension and termination</h2>
          <p>
            We may suspend or terminate access for violations of these terms, security risks, or
            legal requirements. You may stop using Notably at any time.
          </p>
        </article>

        <article className="legal-section">
          <h2>7. Disclaimers and limitation of liability</h2>
          <p>
            Notably is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the
            maximum extent
            permitted by law. To the maximum extent permitted by law, we are not liable for indirect,
            incidental, special, consequential, or punitive damages.
          </p>
        </article>

        <article className="legal-section">
          <h2>8. Contact</h2>
          <p className="info-link-line">
            Terms support: <a href="mailto:support@caymangeiger.com">support@caymangeiger.com</a>
          </p>
          <p className="info-link-line">
            Related policy: <Link href="/privacy">Privacy Policy</Link>
          </p>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
