import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const isForced = args.has("--force");

const localDatabaseUrl = process.env.DATABASE_URL;
const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

const tableSpecs = [
  {
    label: "User",
    table: "User",
    model: "user",
    columns: ["id", "email", "name", "passwordHash", "createdAt", "updatedAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "Session",
    table: "Session",
    model: "session",
    columns: ["id", "token", "userId", "expiresAt", "createdAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "Workspace",
    table: "Workspace",
    model: "workspace",
    columns: ["id", "name", "createdById", "createdAt", "updatedAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "WorkspaceMember",
    table: "WorkspaceMember",
    model: "workspaceMember",
    columns: ["id", "workspaceId", "userId", "role", "createdAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "Note",
    table: "Note",
    model: "note",
    columns: [
      "id",
      "title",
      "contentYdocState",
      "workspaceId",
      "createdById",
      "roomId",
      "viewerCanMessage",
      "archivedAt",
      "createdAt",
      "updatedAt",
    ],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "NoteTemplate",
    table: "NoteTemplate",
    model: "noteTemplate",
    columns: ["id", "name", "description", "contentYdocState", "workspaceId", "createdById", "createdAt", "updatedAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "NotePermission",
    table: "NotePermission",
    model: "notePermission",
    columns: ["id", "noteId", "userId", "role", "createdAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "NoteMessage",
    table: "NoteMessage",
    model: "noteMessage",
    columns: ["id", "noteId", "userId", "body", "createdAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  {
    label: "NoteSnapshot",
    table: "NoteSnapshot",
    model: "noteSnapshot",
    columns: ["id", "noteId", "createdById", "ydocState", "createdAt"],
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
];

function invariant(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function toSelect(columns) {
  return Object.fromEntries(columns.map((column) => [column, true]));
}

function serializeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
}

async function confirmSync(rowCounts) {
  if (isForced) {
    return;
  }

  if (!input.isTTY) {
    throw new Error("Sync confirmation requires a TTY. Re-run with --force if you want to skip the prompt.");
  }

  const rl = createInterface({ input, output });

  try {
    output.write("\nThis will replace the Turso app tables with your local SQLite rows.\n");
    output.write(`Target: ${tursoDatabaseUrl}\n`);
    output.write(`Rows: ${rowCounts}\n\n`);

    const answer = await rl.question('Type "SYNC" to continue: ');

    if (answer.trim() !== "SYNC") {
      throw new Error("Cancelled sync.");
    }
  } finally {
    rl.close();
  }
}

async function main() {
  invariant(localDatabaseUrl, "DATABASE_URL is missing.");
  invariant(tursoDatabaseUrl, "TURSO_DATABASE_URL is missing.");
  invariant(tursoAuthToken, "TURSO_AUTH_TOKEN is missing.");

  const localRows = [];

  for (const spec of tableSpecs) {
    const rows = await prisma[spec.model].findMany({
      select: toSelect(spec.columns),
      orderBy: spec.orderBy,
    });

    localRows.push({ spec, rows });
  }

  const rowCounts = localRows.map(({ spec, rows }) => `${spec.label}:${rows.length}`).join(", ");

  console.log(`Local source: ${localDatabaseUrl}`);
  console.log(`Turso target: ${tursoDatabaseUrl}`);
  console.log(`Rows found: ${rowCounts}`);

  if (isDryRun) {
    console.log("Dry run only. No remote changes applied.");
    return;
  }

  await confirmSync(rowCounts);

  const turso = createClient({
    url: tursoDatabaseUrl,
    authToken: tursoAuthToken,
  });

  const transaction = await turso.transaction("write");

  try {
    for (const { spec } of [...localRows].reverse()) {
      await transaction.execute(`DELETE FROM "${spec.table}"`);
    }

    for (const { spec, rows } of localRows) {
      if (rows.length === 0) {
        continue;
      }

      const columnSql = spec.columns.map((column) => `"${column}"`).join(", ");
      const placeholderSql = spec.columns.map(() => "?").join(", ");
      const sql = `INSERT INTO "${spec.table}" (${columnSql}) VALUES (${placeholderSql})`;

      for (const row of rows) {
        const values = spec.columns.map((column) => serializeValue(row[column]));
        await transaction.execute({ sql, args: values });
      }
    }

    await transaction.commit();
    console.log("Turso sync complete.");
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await turso.close();
  }
}

main()
  .catch((error) => {
    console.error("Failed to sync local SQLite data to Turso.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
