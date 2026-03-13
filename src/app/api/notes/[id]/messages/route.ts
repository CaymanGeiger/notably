import { z } from "zod";

import { canViewNote } from "@/lib/permissions";
import { getNoteAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
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

  const messages = await prisma.noteMessage.findMany({
    where: {
      noteId: id,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 300,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return Response.json({
    messages,
  });
}

export async function POST(
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

    if (access.role === "VIEWER" && !access.viewerCanMessage) {
      return Response.json(
        {
          error: "Viewers cannot post messages in this note",
        },
        {
          status: 403,
        },
      );
    }

    const payload = createMessageSchema.parse(await request.json());

    const message = await prisma.noteMessage.create({
      data: {
        noteId: id,
        userId: user.id,
        body: payload.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return Response.json(
      {
        message,
      },
      {
        status: 201,
      },
    );
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
