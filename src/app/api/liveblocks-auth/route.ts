import { Liveblocks } from "@liveblocks/node";
import { z } from "zod";

import { getNoteByRoomAccessForUser } from "@/lib/note-access";
import { requireCurrentUser, zodErrorResponse } from "@/lib/api";

const liveblocksAuthSchema = z.object({
  room: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = liveblocksAuthSchema.parse(await request.json());

    const access = await getNoteByRoomAccessForUser(payload.room, user.id);

    if (!access) {
      return Response.json(
        {
          error: "You are not allowed to access this room",
        },
        {
          status: 403,
        },
      );
    }

    const secret = process.env.LIVEBLOCKS_SECRET_KEY;

    if (!secret) {
      return Response.json(
        {
          error:
            "LIVEBLOCKS_SECRET_KEY is not configured. Add it to your environment before using realtime.",
        },
        {
          status: 500,
        },
      );
    }

    const liveblocks = new Liveblocks({
      secret,
    });

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.name ?? user.email,
        email: user.email,
        noteId: access.noteId,
        noteRole: access.role,
      },
    });

    session.allow(
      payload.room,
      access.role === "VIEWER" ? session.READ_ACCESS : session.FULL_ACCESS,
    );

    const { body, status } = await session.authorize();

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
