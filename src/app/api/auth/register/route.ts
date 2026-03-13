import { z } from "zod";

import { jsonError, zodErrorResponse } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = registerSchema.parse(await request.json());
    const email = payload.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return jsonError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(payload.password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name: payload.name,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${payload.name ?? "Personal"} Workspace`,
          createdById: createdUser.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: createdUser.id,
          role: "OWNER",
        },
      });

      return createdUser;
    });

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
