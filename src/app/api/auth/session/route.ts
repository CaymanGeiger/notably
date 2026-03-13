import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();

  return Response.json({
    user,
  });
}
