import { z } from "zod";

import { canEditNote, canViewNote } from "@/lib/permissions";
import { getNoteAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const saveNoteContentSchema = z.object({
  ydocState: z.string().min(1).max(5_000_000),
});

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

  if (!access || !canViewNote(access.role)) {
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
      contentYdocState: true,
      updatedAt: true,
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
    const payload = saveNoteContentSchema.parse(await request.json());

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

    if (!canEditNote(access.role)) {
      return Response.json(
        {
          error: "You do not have permission to edit this note",
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
        contentYdocState: payload.ydocState,
      },
      select: {
        id: true,
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
