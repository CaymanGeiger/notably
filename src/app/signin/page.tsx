import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign In | Notably",
  description:
    "Access secure Notably workspaces to collaborate on shared notes, templates, and controlled permissions.",
};

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/workspaces");
  }

  return (
    <main className="auth-shell">
      <section className="auth-layout reveal">
        <aside className="auth-brand stack">
          <Link className="template-back-link" href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <h1>Access secure collaborative workspaces</h1>
          <p>
            Sign in to manage shared team notes with Liveblocks-powered collaboration, clear access,
            and automatic saving.
          </p>
          <ul className="bullet-list">
            <li>Share notes with teammates or clients in seconds</li>
            <li>Every edit saves automatically while you type</li>
            <li>Keep note chat attached to the work, not scattered in threads</li>
          </ul>
        </aside>
        <AuthForm />
      </section>
    </main>
  );
}
