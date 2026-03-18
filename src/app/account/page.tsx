import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AccountSettingsForm } from "@/components/account-settings-form";
import { SignOutButton } from "@/components/signout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Account Settings | Notably",
  description: "Manage your Notably profile, password, and account activity in one place.",
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const account = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          workspaceMembers: true,
          notePermissions: true,
          templatesCreated: true,
        },
      },
    },
  });

  if (!account) {
    redirect("/signin");
  }

  const memberSinceLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(account.createdAt);

  return (
    <main className="app-shell note-shell account-shell">
      <header className="page-header account-header reveal">
        <div className="stack compact">
          <Link className="template-back-link" href="/workspaces">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Workspaces</span>
          </Link>
          <h1>Account settings</h1>
          <p className="muted-text">Manage the profile and security details attached to your Notably account.</p>
        </div>
        <div className="note-header-actions">
          <ThemeToggle initialTheme={initialTheme} />
          <SignOutButton />
        </div>
      </header>

      <AccountSettingsForm
        initialName={account.name}
        email={account.email}
        memberSinceLabel={memberSinceLabel}
        workspaceCount={account._count.workspaceMembers}
        noteCount={account._count.notePermissions}
        templateCount={account._count.templatesCreated}
      />
    </main>
  );
}
