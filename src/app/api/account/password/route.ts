import { z } from "zod";

import { jsonError, requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  nextPassword: z.string().min(8).max(128),
});

export async function PATCH(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = updatePasswordSchema.parse(await request.json());

    if (payload.currentPassword === payload.nextPassword) {
      return jsonError("Choose a different new password.", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!existingUser) {
      return jsonError("User not found", 404);
    }

    const isValid = await verifyPassword(payload.currentPassword, existingUser.passwordHash);

    if (!isValid) {
      return jsonError("Current password is incorrect.", 400);
    }

    const passwordHash = await hashPassword(payload.nextPassword);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
