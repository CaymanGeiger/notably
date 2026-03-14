import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (tursoDatabaseUrl && !process.env.DATABASE_URL) {
  // Prisma still expects a datasource URL to exist even when a driver adapter is used.
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const log: Prisma.PrismaClientOptions["log"] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (tursoDatabaseUrl) {
    const adapter = new PrismaLibSql({
      url: tursoDatabaseUrl,
      authToken: tursoAuthToken,
    });

    return new PrismaClient({
      adapter,
      log,
    });
  }

  return new PrismaClient({
    log,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
