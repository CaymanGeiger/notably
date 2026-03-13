import { z } from "zod";

import { canManageNote } from "@/lib/permissions";
import { getNoteAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const addPermissionSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = addPermissionSchema.parse(await request.json());
    const { id } = await context.params;

    const access = await getNoteAccessForUser(id, user.id);

    if (!access) {
      return Response.json(
        {
          error: "Note not found",
        },
        {
          status: 404,
        },
      );
    }

    if (!canManageNote(access.role)) {
      return Response.json(
        {
          error: "Only note owners can manage permissions",
        },
        {
          status: 403,
        },
      );
    }

    if (payload.userId === user.id) {
      return Response.json(
        {
          error: "Owners cannot change their own note permission",
        },
        {
          status: 400,
        },
      );
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: access.workspaceId,
          userId: payload.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      return Response.json(
        {
          error: "User must be a workspace member before getting note access",
        },
        {
          status: 400,
        },
      );
    }

    const permission = await prisma.notePermission.upsert({
      where: {
        noteId_userId: {
          noteId: id,
          userId: payload.userId,
        },
      },
      create: {
        noteId: id,
        userId: payload.userId,
        role: payload.role,
      },
      update: {
        role: payload.role,
      },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return Response.json({
      permission,
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
