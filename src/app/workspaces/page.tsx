import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/workspace-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

export default async function WorkspacesPage() {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const [workspaceMemberships, notePermissions, templates] = await Promise.all([
    prisma.workspaceMember.findMany({
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
                members: true,
              },
            },
          },
        },
      },
    }),
    prisma.notePermission.findMany({
      where: {
        userId: user.id,
        note: {
          workspace: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
      orderBy: {
        note: {
          updatedAt: "desc",
        },
      },
      select: {
        role: true,
        note: {
          select: {
            id: true,
            title: true,
            workspaceId: true,
            archivedAt: true,
            updatedAt: true,
            workspace: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.noteTemplate.findMany({
      where: {
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        workspaceId: true,
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
    }),
  ]);

  const userDisplayName = (user.name?.trim() || user.email.split("@")[0]).slice(0, 60);

  return (
    <WorkspaceShell
      initialTheme={initialTheme}
      userDisplayName={userDisplayName}
      workspaces={workspaceMemberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
        noteCount: membership.workspace.notes.length,
        memberCount: membership.workspace._count.members,
      }))}
      notes={notePermissions.map((permission) => ({
        id: permission.note.id,
        title: permission.note.title,
        workspaceId: permission.note.workspaceId,
        workspaceName: permission.note.workspace.name,
        role: permission.role,
        archivedAt: permission.note.archivedAt?.toISOString() ?? null,
        updatedAt: permission.note.updatedAt.toISOString(),
      }))}
      templates={templates.map((template) => ({
        id: template.id,
        workspaceId: template.workspaceId,
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
