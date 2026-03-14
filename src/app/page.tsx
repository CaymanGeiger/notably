import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Boxes,
  ClipboardCheck,
  CodeXml,
  Cog,
  Crown,
  Handshake,
  Kanban,
  LifeBuoy,
  Megaphone,
  MessagesSquare,
  Microscope,
  Palette,
  Scale,
  ServerCog,
  SmilePlus,
  Users,
  Wallet,
} from "lucide-react";

import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { HomeScrollEffects } from "@/components/home-scroll-effects";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";
import { cookies } from "next/headers";

const coreCapabilities = [
  {
    title: "One Place For Every Project Conversation",
    description:
      "Keep call notes, decisions, and follow-ups together so your team is never digging through scattered threads.",
  },
  {
    title: "Permissions People Actually Understand",
    description:
      "Set view, edit, and owner access on each note so the right people can act without risking sensitive details.",
  },
  {
    title: "Feedback Stays Next To The Work",
    description:
      "Comments and updates live inside the note itself, so decisions stay clear from kickoff through delivery.",
  },
];

const architectureFlow = [
  {
    heading: "Capture",
    detail:
      "Write decisions while meetings are happening so momentum never gets lost after the call ends.",
  },
  {
    heading: "Share",
    detail:
      "Invite teammates or clients instantly and set access per note so everyone sees exactly what they should.",
  },
  {
    heading: "Move",
    detail:
      "Every edit saves automatically so your team can keep moving without losing work.",
  },
];

type TrustedBrand = {
  label: string;
  Icon: LucideIcon;
};

const trustedBrands: TrustedBrand[] = [
  { label: "Product Teams", Icon: Boxes },
  { label: "Operations", Icon: Cog },
  { label: "Client Services", Icon: MessagesSquare },
  { label: "Design", Icon: Palette },
  { label: "Engineering", Icon: CodeXml },
  { label: "Leadership", Icon: Crown },
  { label: "Marketing", Icon: Megaphone },
  { label: "Sales", Icon: BadgeDollarSign },
  { label: "Customer Success", Icon: SmilePlus },
  { label: "Support", Icon: LifeBuoy },
  { label: "Finance", Icon: Wallet },
  { label: "HR", Icon: Users },
  { label: "Legal", Icon: Scale },
  { label: "IT Admin", Icon: ServerCog },
  { label: "QA", Icon: ClipboardCheck },
  { label: "Research", Icon: Microscope },
  { label: "Project Management", Icon: Kanban },
  { label: "Partnerships", Icon: Handshake },
];

const teamWorkflows = [
  {
    title: "Client Delivery",
    detail: "Share polished project notes with clients while keeping owner-level controls on internal edits.",
  },
  {
    title: "Weekly Planning",
    detail: "Run planning in one shared note so priorities, blockers, and next steps are always current.",
  },
  {
    title: "Handoffs",
    detail: "Pass work between teammates with context preserved, not scattered across chat and email.",
  },
  {
    title: "Postmortems",
    detail: "Document what happened, what changed, and what to do next in a note everyone can revisit.",
  },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();

  return (
    <main className="home-page">
      <HomeScrollEffects />
      <PublicNav animateBrand isSignedIn={Boolean(user)} initialTheme={initialTheme} />

      <section className="home-hero reveal">
        <div className="hero-copy">
          <p className="eyebrow">Notes Built For Teams</p>
          <h1>Keep your team aligned with shared notes everyone can trust.</h1>
          <p className="hero-subtitle">
            Notably helps product, operations, and client teams capture decisions, assign the right
            access, and keep work moving without messy handoffs.
          </p>
          <div className="hero-points">
            <p>
              <strong>For teams:</strong> Keep decisions in one clear source of truth.
            </p>
            <p>
              <strong>For managers:</strong> Know who owns every note and update.
            </p>
            <p>
              <strong>For clients:</strong> Share progress without exposing internal drafts.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="primary-btn" href={user ? "/workspaces" : "/signin"}>
              {user ? "Continue To Workspaces" : "Get Started"}
            </Link>
            <Link className="ghost-btn" href="/how-it-works">
              See How It Works
            </Link>
          </div>
        </div>

        <aside className="hero-side">
          <p className="eyebrow">A Typical Note Flow</p>
          <h2>From kickoff to delivery without losing context.</h2>
          <ol className="hero-sequence">
            <li>
              <div>
                <h3>Kickoff notes</h3>
                <p>Capture goals, constraints, and owners while everyone is in the room.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>In-flight updates</h3>
                <p>Track progress and decisions in one living note the whole team can reference.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>Client-ready recap</h3>
                <p>Share the same note with polished access settings and clear next steps.</p>
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <section className="trust-strip reveal">
        <p>Designed for teams across</p>
        <div className="trust-carousel" aria-label="Team types">
          <div className="trust-track">
            <div className="trust-group">
              {trustedBrands.map((brand) => (
                <span className="trust-slide" key={brand.label}>
                  <span className="trust-slide-icon">
                    <brand.Icon />
                  </span>
                  <span className="trust-slide-label">{brand.label}</span>
                </span>
              ))}
            </div>
            <div className="trust-group" aria-hidden="true">
              {trustedBrands.map((brand) => (
                <span className="trust-slide" key={`${brand.label}-duplicate-a`}>
                  <span className="trust-slide-icon">
                    <brand.Icon />
                  </span>
                  <span className="trust-slide-label">{brand.label}</span>
                </span>
              ))}
            </div>
            <div className="trust-group" aria-hidden="true">
              {trustedBrands.map((brand) => (
                <span className="trust-slide" key={`${brand.label}-duplicate-b`}>
                  <span className="trust-slide-icon">
                    <brand.Icon />
                  </span>
                  <span className="trust-slide-label">{brand.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="impact-band reveal">
        <article className="impact-item">
          <span>01</span>
          <strong>Fewer status pings</strong>
          <p>Everyone can see the latest note updates without asking for another recap.</p>
        </article>
        <article className="impact-item">
          <span>02</span>
          <strong>Cleaner handoffs</strong>
          <p>Notes stay readable and structured when work moves across teams.</p>
        </article>
        <article className="impact-item">
          <span>03</span>
          <strong>Less rework</strong>
          <p>Autosave keeps progress protected while your team collaborates in real time.</p>
        </article>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <p className="eyebrow">Capabilities</p>
          <h2>Everything your team needs to keep notes useful day after day</h2>
        </div>
        <div className="feature-lines">
          {coreCapabilities.map((capability, index) => (
            <article className="feature-line" key={capability.title}>
              <span className="feature-line-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <p className="eyebrow">Workflow</p>
          <h2>A simple rhythm your whole team can follow</h2>
        </div>
        <div className="flow-timeline">
          {architectureFlow.map((step, index) => (
            <article className="flow-step" key={step.heading}>
              <span className="flow-step-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.heading}</h3>
                <p>{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-canvas reveal">
        <div className="canvas-copy">
          <p className="eyebrow">Where Teams Use Notably</p>
          <h2>Built for the moments where clarity matters most.</h2>
          <p>
            Notably is designed for everyday collaboration and client-facing work, so teams can move
            faster without sacrificing control.
          </p>
        </div>
        <div className="canvas-rail">
          {teamWorkflows.map((workflow) => (
            <article className="canvas-row" key={workflow.title}>
              <h3>{workflow.title}</h3>
              <p>{workflow.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta reveal">
        <div className="cta-copy">
          <h2>Ready to make team notes actually usable?</h2>
          <p>
            Bring project context, decisions, and follow-ups into one shared system your team and
            clients can trust.
          </p>
          <ul className="cta-points">
            <li>Share updates in seconds</li>
            <li>Control access on every note</li>
            <li>Keep comments tied to the work</li>
            <li>Autosave every change by default</li>
          </ul>
        </div>
        <Link className="primary-btn" href={user ? "/workspaces" : "/signin"}>
          {user ? "Open Notably" : "Start With Notably"}
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
