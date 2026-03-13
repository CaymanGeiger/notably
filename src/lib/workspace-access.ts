import type { WorkspaceRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type WorkspaceAccess = {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
};

export async function getWorkspaceAccessForUser(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceAccess | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
    role: membership.role,
  };
}
