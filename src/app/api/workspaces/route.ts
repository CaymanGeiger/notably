import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function GET(): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  const workspaceMembers = await prisma.workspaceMember.findMany({
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
          createdAt: true,
          updatedAt: true,
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
  });

  return Response.json({
    workspaces: workspaceMembers.map((member) => ({
      id: member.workspace.id,
      name: member.workspace.name,
      role: member.role,
      createdAt: member.workspace.createdAt,
      updatedAt: member.workspace.updatedAt,
      noteCount: member.workspace.notes.length,
      memberCount: member.workspace._count.members,
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = createWorkspaceSchema.parse(await request.json());

    const workspace = await prisma.workspace.create({
      data: {
        name: payload.name,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        workspace,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return zodErrorResponse(error);
  }
}
