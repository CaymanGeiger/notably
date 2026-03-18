import { randomUUID } from "crypto";

import type { User } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "redstone_session";

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? "30");

export type SessionUser = Pick<User, "id" | "email" | "name">;

function getSessionExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomUUID();
  const expiresAt = getSessionExpiryDate();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        token,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(options?: {
  clearInvalidCookie?: boolean;
}): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const clearInvalidCookie = options?.clearInvalidCookie ?? false;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    if (clearInvalidCookie) {
      cookieStore.delete(SESSION_COOKIE);
    }
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });
    if (clearInvalidCookie) {
      cookieStore.delete(SESSION_COOKIE);
    }
    return null;
  }

  return session.user;
}
