import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { HomeScrollEffects } from "@/components/home-scroll-effects";
import { ThemeAwareTourShot } from "@/components/theme-aware-tour-shot";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "See How It Works | Notably",
  description: "A visual walkthrough of how teams use Notably for workspaces, templates, and note permissions.",
};

const walkthroughSteps = [
  {
    eyebrow: "Step 1",
    title: "Keep workspaces readable at a glance",
    description:
      "Start from a workspace view that keeps docs, filters, archive state, and team context in one place instead of split across tools.",
    bullets: [
      "Search and scan every note from one shared workspace.",
      "Filter by what you own, can edit, can view, or have archived.",
      "Keep team actions next to the selected workspace instead of buried in settings.",
    ],
    darkImageSrc: "/assets/how-it-works/workspace-overview.png",
    lightImageSrc: "/assets/how-it-works/workspace-overview-light.png",
    imageAlt: "Workspace view showing a workspace sidebar, doc filters, and a structured list of notes.",
  },
  {
    eyebrow: "Step 2",
    title: "Start new docs from reusable templates",
    description:
      "When a team creates a doc, they can pick from saved templates immediately instead of rebuilding the same structure every time.",
    bullets: [
      "Open template choices directly inside create doc.",
      "Preview reusable structures before committing to one.",
      "Keep doc creation fast without losing consistency.",
    ],
    darkImageSrc: "/assets/how-it-works/workspace-create-doc.png",
    lightImageSrc: "/assets/how-it-works/workspace-create-doc-light.png",
    imageAlt: "Create doc modal with built-in template selection and preview controls.",
  },
  {
    eyebrow: "Step 3",
    title: "Build repeatable note structures in template studio",
    description:
      "Template studio gives teams one place to define recurring note layouts so project updates, client recaps, and weekly plans all start cleanly.",
    bullets: [
      "Manage templates per workspace.",
      "Edit structure once and reuse it across new docs.",
      "Keep the template list, metadata, and editor together in one focused space.",
    ],
    darkImageSrc: "/assets/how-it-works/template-studio.png",
    lightImageSrc: "/assets/how-it-works/template-studio-light.png",
    imageAlt: "Template studio showing the template list, details panel, and editor surface.",
  },
  {
    eyebrow: "Step 4",
    title: "Control access on every note",
    description:
      "Each note carries its own settings and permission model, so owners can decide who edits, who views, and whether viewers can join chat.",
    bullets: [
      "Update note-level settings without leaving the editor.",
      "Grant owner, editor, or viewer access per note.",
      "Keep collaboration controlled without slowing the team down.",
    ],
    darkImageSrc: "/assets/how-it-works/note-permissions.png",
    lightImageSrc: "/assets/how-it-works/note-permissions-light.png",
    imageAlt: "Note detail page showing the editor, note settings, and permission manager side by side.",
  },
];

export default async function HowItWorksPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();
  const accountLabel = user ? (user.name?.trim() || user.email.split("@")[0] || "Account") : undefined;

  return (
    <main className="home-page tour-page">
      <HomeScrollEffects />
      <PublicNav isSignedIn={Boolean(user)} initialTheme={initialTheme} accountLabel={accountLabel} />

      <section className="tour-hero reveal">
        <div className="tour-hero-copy">
          <p className="eyebrow">Product Tour</p>
          <h1>See how Notably turns scattered team notes into one controlled workflow.</h1>
          <p className="tour-hero-subtitle">
            Workspaces organize the day-to-day view, templates speed up repeat work, and note-level
            permissions keep the right people involved at the right level.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href={user ? "/workspaces" : "/signin"}>
              {user ? "Open Workspaces" : "Start With Notably"}
            </Link>
            <Link className="ghost-btn" href="/">
              Back Home
            </Link>
          </div>
        </div>

        <aside className="tour-hero-rail" aria-label="Tour steps">
          {walkthroughSteps.map((step) => (
            <article className="tour-summary-chip" key={step.title}>
              <p>{step.eyebrow}</p>
              <strong>{step.title}</strong>
            </article>
          ))}
        </aside>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <p className="eyebrow">Walkthrough</p>
          <h2>Four moments that show the core product loop</h2>
          <p className="tour-section-intro">
            These are live screenshots from the app, linked to the original image assets used on
            this page.
          </p>
        </div>
      </section>

      <div className="tour-step-stack">
        {walkthroughSteps.map((step, index) => (
          <section
            className={`tour-step reveal ${index % 2 === 1 ? "tour-step-reverse" : ""}`}
            key={step.title}
          >
            <div className="tour-step-copy">
              <p className="eyebrow">{step.eyebrow}</p>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <ul className="tour-bullets">
                {step.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>

            <ThemeAwareTourShot
              title={step.title}
              alt={step.imageAlt}
              darkSrc={step.darkImageSrc}
              lightSrc={step.lightImageSrc}
              initialTheme={initialTheme}
            />
          </section>
        ))}
      </div>

      <section className="home-cta reveal">
        <div className="cta-copy">
          <h2>Ready to move from scattered notes to a controlled team workflow?</h2>
          <p>
            Notably keeps structure, permissions, and realtime collaboration in one place so teams
            can move faster without losing trust in the note.
          </p>
        </div>
        <Link className="primary-btn" href={user ? "/workspaces" : "/signin"}>
          {user ? "Continue To Workspaces" : "Create Account"}
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
