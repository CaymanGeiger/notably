import { z } from "zod";

import { canEditNote, canManageNote } from "@/lib/permissions";
import { getNoteAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    viewerCanMessage: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.viewerCanMessage !== undefined ||
      value.archived !== undefined,
    {
    message: "At least one field is required",
    },
  );

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

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

  const note = await prisma.note.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      roomId: true,
      viewerCanMessage: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      permissions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!note) {
    return Response.json(
      {
        error: "Note not found",
      },
      {
        status: 404,
      },
    );
  }

  return Response.json({
    note,
    role: access.role,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
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

    const payload = updateNoteSchema.parse(await request.json());

    if (payload.title !== undefined && !canEditNote(access.role)) {
      return Response.json(
        {
          error: "You do not have permission to edit this note",
        },
        {
          status: 403,
        },
      );
    }

    if (payload.viewerCanMessage !== undefined && !canManageNote(access.role)) {
      return Response.json(
        {
          error: "Only owners can change messaging permissions",
        },
        {
          status: 403,
        },
      );
    }

    if (payload.archived !== undefined && !canEditNote(access.role)) {
      return Response.json(
        {
          error: "You do not have permission to archive this note",
        },
        {
          status: 403,
        },
      );
    }

    const note = await prisma.note.update({
      where: {
        id,
      },
      data: {
        ...(payload.title !== undefined
          ? {
              title: payload.title,
            }
          : {}),
        ...(payload.viewerCanMessage !== undefined
          ? {
              viewerCanMessage: payload.viewerCanMessage,
            }
          : {}),
        ...(payload.archived !== undefined
          ? {
              archivedAt: payload.archived ? new Date() : null,
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        viewerCanMessage: true,
        archivedAt: true,
        updatedAt: true,
      },
    });

    return Response.json({
      note,
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
