import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Privacy | Notably",
  description: "How Notably collects, uses, stores, and protects workspace and account data.",
};

const EFFECTIVE_DATE = "March 7, 2026";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();

  return (
    <main className="home-page info-page">
      <PublicNav isSignedIn={Boolean(user)} initialTheme={initialTheme} />

      <section className="home-section reveal info-hero">
        <div className="section-head">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="info-subtitle">
            Notably is built for collaborative team notes with strict per-note permissions. This
            policy explains what data we collect and how we use it to run the product.
          </p>
          <p className="info-meta">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <section className="legal-stack reveal" aria-label="Privacy sections">
        <article className="legal-section">
          <h2>1. Information we collect</h2>
          <ul className="bullet-list">
            <li>Account data: name, email address, password hash, and session records.</li>
            <li>Workspace and note data: workspace names, note titles, ACL roles, and metadata.</li>
            <li>Collaboration content: note messages and realtime presence details.</li>
            <li>Operational data: server logs and request metadata for reliability and security.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>2. How we use information</h2>
          <ul className="bullet-list">
            <li>Authenticate users and maintain secure sessions.</li>
            <li>Enforce workspace membership and note-level OWNER/EDITOR/VIEWER permissions.</li>
            <li>Provide realtime editing, messaging, and always-on autosave workflows.</li>
            <li>Deliver transactional emails such as workspace invites and membership notices.</li>
            <li>Detect abuse, investigate incidents, and improve product reliability.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>3. Sharing and processors</h2>
          <p>
            We do not sell personal information. We may share data with service providers that help
            us deliver core features, such as realtime collaboration infrastructure and transactional
            email delivery. We may also disclose information when required by law or to protect the
            security of Notably and its users.
          </p>
        </article>

        <article className="legal-section">
          <h2>4. Retention and deletion</h2>
          <p>
            We retain account and workspace data while your account is active, and for a reasonable
            period afterward when needed for legal, security, and operational reasons. You can
            request account deletion at any time by contacting us.
          </p>
          <p className="info-link-line">
            Privacy requests: <a href="mailto:privacy@caymangeiger.com">privacy@caymangeiger.com</a>
          </p>
        </article>

        <article className="legal-section">
          <h2>5. Security controls</h2>
          <ul className="bullet-list">
            <li>Password hashes are stored using bcrypt.</li>
            <li>Session cookies are `httpOnly` and scoped for secure authentication flows.</li>
            <li>Realtime room access is authorized server-side before token issuance.</li>
            <li>Role checks gate note edits and messaging permissions.</li>
          </ul>
        </article>

        <article className="legal-section">
          <h2>6. Updates to this policy</h2>
          <p>
            We may update this policy from time to time. If changes are material, we will update the
            effective date and provide notice through the product or other reasonable channels.
          </p>
          <p className="info-link-line">
            Also see: <Link href="/terms">Terms of Service</Link>
          </p>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
