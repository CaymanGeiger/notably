import { z } from "zod";

import { requireCurrentUser, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  sendWorkspaceInviteEmail,
  sendWorkspaceMembershipAddedEmail,
} from "@/lib/workspace-invite-email";

const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
});

function resolveAppUrl(request: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:3000";
  }
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
    const payload = inviteMemberSchema.parse(await request.json());
    const { id } = await context.params;
    const email = payload.email.toLowerCase();

    const access = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
      select: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!access) {
      return Response.json(
        {
          error: "Workspace not found",
        },
        {
          status: 404,
        },
      );
    }

    if (access.role !== "OWNER") {
      return Response.json(
        {
          error: "Only workspace owners can invite members",
        },
        {
          status: 403,
        },
      );
    }

    if (email === user.email.toLowerCase()) {
      return Response.json(
        {
          error: "You are already a member of this workspace",
        },
        {
          status: 400,
        },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const appUrl = resolveAppUrl(request);
    const actorName = user.name?.trim() || user.email;

    if (targetUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: targetUser.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingMembership) {
        return Response.json(
          {
            error: "That user is already a workspace member",
          },
          {
            status: 400,
          },
        );
      }

      await prisma.workspaceMember.create({
        data: {
          workspaceId: id,
          userId: targetUser.id,
          role: "MEMBER",
        },
      });

      try {
        await sendWorkspaceMembershipAddedEmail({
          to: targetUser.email,
          workspaceName: access.workspace.name,
          addedByName: actorName,
          appUrl: `${appUrl}/workspaces`,
        });
      } catch (emailError) {
        console.error("Workspace member added but email failed", emailError);
        return Response.json(
          {
            message: "Member added, but email delivery failed.",
          },
          {
            status: 201,
          },
        );
      }

      return Response.json(
        {
          message: "Member added and notified by email.",
        },
        {
          status: 201,
        },
      );
    }

    const signInUrl = `${appUrl}/signin`;

    await sendWorkspaceInviteEmail({
      to: email,
      workspaceName: access.workspace.name,
      invitedByName: actorName,
      signInUrl,
    });

    return Response.json(
      {
        message:
          "Invite email sent. Ask them to create an account with this email, then invite again to grant access.",
      },
      {
        status: 201,
      },
    );
  } catch (routeError) {
    return zodErrorResponse(routeError);
  }
}
