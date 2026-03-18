import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser({
    clearInvalidCookie: true,
  });

  return Response.json({
    user,
  });
}
