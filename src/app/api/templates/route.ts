import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessForUser } from "@/lib/workspace-access";

const createTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(240).optional(),
  contentYdocState: z.string().min(1).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return Response.json(
      {
        error: "workspaceId is required",
      },
      {
        status: 400,
      },
    );
  }

  const access = await getWorkspaceAccessForUser(workspaceId, user.id);

  if (!access) {
    return Response.json(
      {
        error: "You are not a member of this workspace",
      },
      {
        status: 403,
      },
    );
  }

  const templates = await prisma.noteTemplate.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
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
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireCurrentUser();

  if (error || !user) {
    return error;
  }

  try {
    const payload = createTemplateSchema.parse(await request.json());
    const access = await getWorkspaceAccessForUser(payload.workspaceId, user.id);

    if (!access) {
      return Response.json(
        {
          error: "You are not a member of this workspace",
        },
        {
          status: 403,
        },
      );
    }

    const template = await prisma.noteTemplate.create({
      data: {
        workspaceId: payload.workspaceId,
        createdById: user.id,
        name: payload.name ?? "Untitled template",
        description: payload.description || null,
        contentYdocState: payload.contentYdocState ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        contentYdocState: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return Response.json(
      {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          contentYdocState: template.contentYdocState,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          createdBy: template.createdBy,
        },
      },
      {
        status: 201,
      },
    );
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
