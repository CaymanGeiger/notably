import { randomUUID } from "crypto";

import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessForUser } from "@/lib/workspace-access";

const createNoteSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().trim().min(1).max(120).optional(),
  templateId: z.string().min(1).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") ?? undefined;

  const permissions = await prisma.notePermission.findMany({
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
        ...(workspaceId
          ? {
              workspaceId,
            }
          : {}),
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
          roomId: true,
          viewerCanMessage: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return Response.json({
    notes: permissions.map((permission) => ({
      id: permission.note.id,
      title: permission.note.title,
      roomId: permission.note.roomId,
      viewerCanMessage: permission.note.viewerCanMessage,
      archivedAt: permission.note.archivedAt,
      createdAt: permission.note.createdAt,
      updatedAt: permission.note.updatedAt,
      workspace: permission.note.workspace,
      role: permission.role,
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = createNoteSchema.parse(await request.json());
    const membership = await getWorkspaceAccessForUser(payload.workspaceId, user.id);

    if (!membership) {
      return Response.json(
        {
          error: "You are not a member of this workspace",
        },
        {
          status: 403,
        },
      );
    }

    const roomId = `note-${randomUUID()}`;
    const template = payload.templateId
      ? await prisma.noteTemplate.findUnique({
          where: {
            id: payload.templateId,
          },
          select: {
            id: true,
            name: true,
            workspaceId: true,
            contentYdocState: true,
          },
        })
      : null;

    if (payload.templateId && !template) {
      return Response.json(
        {
          error: "Template not found",
        },
        {
          status: 404,
        },
      );
    }

    if (template && template.workspaceId !== payload.workspaceId) {
      return Response.json(
        {
          error: "Template does not belong to this workspace",
        },
        {
          status: 400,
        },
      );
    }

    const note = await prisma.note.create({
      data: {
        title: payload.title ?? template?.name ?? "Untitled note",
        contentYdocState: template?.contentYdocState ?? null,
        workspaceId: payload.workspaceId,
        createdById: user.id,
        roomId,
        permissions: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        title: true,
        roomId: true,
        workspaceId: true,
        archivedAt: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        note,
      },
      {
        status: 201,
      },
    );
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
