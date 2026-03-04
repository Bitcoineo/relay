# Relay

Real-time team chat built with Next.js, Socket.io, and Drizzle ORM.

## Features

- **Real-time messaging** via Socket.io with instant delivery
- **Workspaces & channels** for organized team communication
- **@mentions** with autocomplete and email notifications for offline users
- **Presence indicators** — online, idle, and offline status in real time
- **Typing indicators** with animated feedback
- **Infinite scroll** message history with cursor-based pagination
- **Email verification** with token-based flow
- **Role-based permissions** — Owner, Admin, Member
- **Google OAuth** + email/password authentication via Auth.js v5
- **Invite system** with shareable links and auto-join on accept
- **Responsive** — collapsible sidebar on mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Turso (libSQL) + Drizzle ORM |
| Auth | Auth.js v5 (Google OAuth + credentials) |
| Real-time | Socket.io (custom server wrapping Next.js) |
| Email | Resend + React Email |
| Styling | Tailwind CSS |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Turso](https://turso.tech) database
- [Google OAuth](https://console.cloud.google.com) credentials
- [Resend](https://resend.com) API key

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
   cd relay
   pnpm install
   ```

2. Create `.env.local` with the following variables:

   ```
   DATABASE_URL=libsql://your-db.turso.io
   DATABASE_AUTH_TOKEN=your-turso-auth-token
   AUTH_SECRET=your-auth-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=Relay <noreply@yourdomain.com>
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. Run database migrations:

   ```bash
   pnpm db:migrate
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Socket.io + Next.js) |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed test data |

## Architecture

- **Custom server** (`server.ts`) wraps Next.js with Socket.io for WebSocket support
- **Presence** tracked in-memory on the Socket.io server (`Map<userId, Set<socketId>>`)
- **Messages** persisted to DB on send, then broadcast to channel subscribers
- **Mentions** parsed from message content (`@username`), stored as rows, triggers email for offline users
- **Idle detection** client-side (5 min timeout) with server broadcast

## Built by

[Bitcoineo](https://github.com/bitcoineo)
