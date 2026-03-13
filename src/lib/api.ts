import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/session";

export function jsonError(message: string, status: number): Response {
  return Response.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

export function zodErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Invalid request payload",
        details: error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  return jsonError("Unexpected server error", 500);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: jsonError("Unauthorized", 401),
      user: null,
    };
  }

  return {
    error: null,
    user,
  };
}
