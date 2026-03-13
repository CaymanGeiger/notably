import { z } from "zod";

import { canManageNote } from "@/lib/permissions";
import { getNoteAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updatePermissionSchema = z.object({
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> },
): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const { id, userId } = await context.params;
    const payload = updatePermissionSchema.parse(await request.json());

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

    if (userId === user.id) {
      return Response.json(
        {
          error: "Owners cannot change their own note permission",
        },
        {
          status: 400,
        },
      );
    }

    const existingPermission = await prisma.notePermission.findUnique({
      where: {
        noteId_userId: {
          noteId: id,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!existingPermission) {
      return Response.json(
        {
          error: "Permission not found",
        },
        {
          status: 404,
        },
      );
    }

    if (existingPermission.role === "OWNER" && payload.role !== "OWNER") {
      const ownerCount = await prisma.notePermission.count({
        where: {
          noteId: id,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return Response.json(
          {
            error: "A note must keep at least one owner",
          },
          {
            status: 400,
          },
        );
      }
    }

    const permission = await prisma.notePermission.update({
      where: {
        noteId_userId: {
          noteId: id,
          userId,
        },
      },
      data: {
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
