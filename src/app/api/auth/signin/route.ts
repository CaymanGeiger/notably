import { z } from "zod";

import { jsonError, zodErrorResponse } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = signInSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: {
        email: payload.email.toLowerCase().trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const isValid = await verifyPassword(payload.password, user.passwordHash);

    if (!isValid) {
      return jsonError("Invalid email or password", 401);
    }

    await createSession(user.id);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return zodErrorResponse(error);
  }
}
