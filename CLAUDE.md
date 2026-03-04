# Relay — Real-time Team Chat

## Overview
A Slack-lite team chat app with real-time messaging via Socket.io, email verification, presence/typing indicators, @mentions with email notifications via Resend, and infinite scroll message history.

## Tech Stack
Next.js 14 (App Router), TypeScript strict, Drizzle ORM + Turso, Auth.js v5 (Google OAuth + credentials), Socket.io, Resend, React Email, Tailwind CSS, pnpm

## Database Schema
Auth tables: user, account, session, verificationToken (standard Auth.js)

Extended user fields:
- emailVerified (integer, 0 or 1, default 0)
- lastSeenAt (text, ISO timestamp, nullable)
- avatarColor (text, nullable)
- status (text: online/offline/idle, default 'offline')

App tables:

workspace:
- id (nanoid), name, slug (unique), ownerId (FK user), createdAt

workspace_member:
- id (nanoid), workspaceId (FK), userId (FK), role (text: owner/admin/member), joinedAt
- Unique constraint on (workspaceId, userId)

channel:
- id (nanoid), workspaceId (FK), name, description (nullable), isDefault (integer, 0/1), createdBy (FK user), createdAt

channel_member:
- channelId (FK), userId (FK), joinedAt
- Primary key on (channelId, userId)

message:
- id (nanoid), channelId (FK), userId (FK), content (text), createdAt
- Index on (channelId, createdAt) for pagination

mention:
- id (nanoid), messageId (FK), userId (FK), notified (integer, 0/1, default 0)

email_verification_token:
- id (nanoid), userId (FK), token (text, unique), expiresAt (text, ISO), createdAt

## Key Architecture Decisions
- Socket.io runs as a custom Next.js server (server.ts at root) wrapping the Next.js app
- Presence tracked in-memory on the Socket.io server (Map of userId → socketId)
- Messages persisted to DB on send, then broadcast to channel via Socket.io
- Email verification: token-based, 24hr expiry, blocks app access until verified
- Mentions: parse @username from message content, create mention rows, check if user is offline, queue email
- Infinite scroll: cursor-based pagination (createdAt < cursor, LIMIT 50, ORDER BY createdAt DESC)

## Roles & Permissions
Owner: everything + delete workspace
Admin: manage channels + manage members
Member: send messages + join public channels

## API Routes
Auth: signup, signin, verify-email, resend-verification
Workspace: CRUD + member management
Channel: CRUD within workspace
Message: create (via Socket.io primarily, REST fallback), list with pagination
Mention: mark as read

## Socket.io Events
Client → Server:
- join_channel(channelId)
- leave_channel(channelId)
- send_message({ channelId, content })
- typing_start(channelId)
- typing_stop(channelId)

Server → Client:
- new_message(message)
- user_typing({ channelId, userId, userName })
- user_stop_typing({ channelId, userId })
- presence_update({ userId, status })
- message_deleted(messageId)

## Coding Standards
- Lib layer for business logic, {data, error} return pattern
- All queries scoped to workspace
- Permission checks on mutations
- Socket.io events authenticated via session token

## Commands
- `pnpm dev` — starts custom server (tsx server.ts) with Socket.io + Next.js
- `pnpm build` — Next.js production build
- `pnpm db:migrate` — run Drizzle migrations
- `pnpm db:seed` — seed test data
- `pnpm db:generate` — generate migration files
