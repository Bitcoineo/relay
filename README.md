# Relay

Real-time team chat. Workspaces, channels, @mentions, presence indicators, typing indicators, and email notifications for offline users.

**Stack:** `Next.js 14 · TypeScript · Socket.io · Auth.js v5 · Drizzle ORM · Turso (SQLite) · Resend · React Email · Tailwind CSS`

**Live:** https://relay-2s1r.onrender.com

---

## Why I built this

I wanted to understand how real-time chat actually works at the infrastructure level: WebSockets with Socket.io, presence tracking across multiple connections per user, typing indicators without flooding the server, cursor-based pagination for message history, and @mention parsing that triggers transactional email for offline users. Relay is a full implementation of all of it.

## Features

- **Real-time messaging** Socket.io with instant delivery across all connected clients
- **Workspaces and channels** Organized team communication with role-based permissions
- **@mentions** Autocomplete while typing, email notification sent via Resend if the mentioned user is offline
- **Presence indicators** Online, idle, and offline status tracked in real time across multiple tabs
- **Typing indicators** Animated feedback with debounced server events
- **Infinite scroll** Cursor-based pagination for message history
- **Email verification** Token-based signup flow with transactional email
- **Authentication** Google OAuth and email/password via Auth.js v5
- **Invite system** Shareable links with auto-join on accept
- **React Email templates** Transactional emails for verification, welcome, and mentions

## Setup

    pnpm install
    cp .env.example .env.local

Fill in your .env.local:

    DATABASE_URL=           # libsql://your-db.turso.io
    DATABASE_AUTH_TOKEN=    # Turso auth token
    AUTH_SECRET=            # openssl rand -base64 32
    GOOGLE_CLIENT_ID=       # Google OAuth client ID
    GOOGLE_CLIENT_SECRET=   # Google OAuth client secret
    RESEND_API_KEY=         # Resend API key
    RESEND_FROM_EMAIL=      # Relay <noreply@yourdomain.com>
    NEXT_PUBLIC_BASE_URL=   # http://localhost:3000 for dev

Run migrations and start:

    pnpm db:migrate
    pnpm dev

Open http://localhost:3000

## Architecture

- **Custom server** server.ts wraps Next.js with Socket.io for WebSocket support
- **Presence** tracked in-memory on the Socket.io server using Map<userId, Set<socketId>>
- **Messages** persisted to DB on send, then broadcast to all channel subscribers
- **Mentions** parsed from message content, stored as rows, triggers Resend email for offline users
- **Idle detection** client-side 5-minute timeout with server broadcast

## GitHub Topics

`nextjs` `typescript` `socket-io` `real-time` `chat` `websockets` `drizzle-orm` `turso` `authjs` `resend` `react-email` `tailwind` `presence`
