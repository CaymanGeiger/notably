import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullable().optional(),
  contentYdocState: z.string().min(1).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = updateTemplateSchema.parse(await request.json());
    const { id } = await context.params;

    const template = await prisma.noteTemplate.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        workspace: {
          select: {
            members: {
              where: {
                userId: user.id,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      return Response.json(
        {
          error: "Template not found",
        },
        {
          status: 404,
        },
      );
    }

    if (template.workspace.members.length === 0) {
      return Response.json(
        {
          error: "You are not a member of this workspace",
        },
        {
          status: 403,
        },
      );
    }

    const updatedTemplate = await prisma.noteTemplate.update({
      where: {
        id,
      },
      data: {
        name: payload.name,
        description: payload.description || null,
        contentYdocState: payload.contentYdocState ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        contentYdocState: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return Response.json({
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        contentYdocState: updatedTemplate.contentYdocState,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
        createdBy: updatedTemplate.createdBy,
      },
    });
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
