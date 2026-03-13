import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TemplateStudio } from "@/components/template-studio";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

type TemplatesPageProps = {
  searchParams: Promise<{
    workspaceId?: string;
  }>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const { workspaceId } = await searchParams;

  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      workspace: {
        updatedAt: "desc",
      },
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          notes: {
            where: {
              archivedAt: null,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              templates: true,
            },
          },
        },
      },
    },
  });

  const selectedWorkspaceId =
    workspaceMemberships.find((membership) => membership.workspace.id === workspaceId)?.workspace.id ??
    workspaceMemberships[0]?.workspace.id ??
    "";

  const templates = selectedWorkspaceId
    ? await prisma.noteTemplate.findMany({
        where: {
          workspaceId: selectedWorkspaceId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          contentYdocState: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : [];

  const userDisplayName = (user.name?.trim() || user.email.split("@")[0]).slice(0, 60);

  return (
    <TemplateStudio
      initialTheme={initialTheme}
      userDisplayName={userDisplayName}
      selectedWorkspaceId={selectedWorkspaceId}
      workspaces={workspaceMemberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
        noteCount: membership.workspace.notes.length,
        templateCount: membership.workspace._count.templates,
      }))}
      templates={templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        contentYdocState: template.contentYdocState,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        createdBy: {
          id: template.createdBy.id,
          name: template.createdBy.name,
          email: template.createdBy.email,
        },
      }))}
    />
  );
}
