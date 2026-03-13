# Redstone Collaborative

Redstone Collaborative is a local-first collaborative notes app built with Next.js, Prisma/SQLite, and Liveblocks + Yjs.

## Core Capabilities

- Email/password accounts with session cookies
- Workspaces and workspace membership
- Notes with per-note ACL (`OWNER`, `EDITOR`, `VIEWER`)
- Realtime collaborative note editing (Liveblocks + Yjs)
- Durable per-note chat history in SQLite with realtime fanout
- Snapshot timeline for note recovery/replay workflows

## Stack

- Next.js App Router + TypeScript
- Prisma + SQLite
- Liveblocks + Yjs

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `DATABASE_URL`: SQLite path (default `file:./dev.db` relative to `prisma/schema.prisma`)
- `LIVEBLOCKS_SECRET_KEY`: required for realtime room auth (`/api/liveblocks-auth`)
- `SESSION_TTL_DAYS`: auth session duration (default `30`)

## Implemented API Routes

- `POST /api/liveblocks-auth`
- `GET|POST /api/workspaces`
- `GET|POST /api/notes`
- `GET|PATCH /api/notes/:id`
- `GET|POST /api/notes/:id/messages`
- `POST /api/notes/:id/permissions`
- `PATCH /api/notes/:id/permissions/:userId`
- `GET|POST /api/notes/:id/snapshots`
- `POST /api/auth/register`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/auth/session`

## Notes

- Room access is always authorized server-side through Prisma ACL checks in `/api/liveblocks-auth`.
- Liveblocks does not directly access the database.
