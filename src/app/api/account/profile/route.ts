import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
});

export async function PATCH(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = updateProfileSchema.parse(await request.json());
    const nextName = payload.name || null;

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: nextName,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return Response.json({
      user: updatedUser,
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
