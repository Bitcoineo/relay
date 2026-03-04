import { config } from "dotenv";
config({ path: ".env.local" });

import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";
import { decode } from "next-auth/jwt";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const nextApp = next({ dev, hostname, port });
const handler = nextApp.getRequestHandler();

// ─── In-memory state ─────────────────────────────────────────────────
// userId → Set of socketIds (multi-tab support)
const connectedUsers = new Map<string, Set<string>>();

// socketId → userId (reverse lookup)
const socketToUser = new Map<string, string>();

// ─── Helpers ─────────────────────────────────────────────────────────

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    cookies[name.trim()] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

async function authenticateSocket(
  socket: Socket
): Promise<string | null> {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const sessionToken =
    cookies["authjs.session-token"] ||
    cookies["__Secure-authjs.session-token"];

  if (!sessionToken) return null;

  try {
    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET!,
      salt: cookies["__Secure-authjs.session-token"]
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    });
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

// ─── Server ──────────────────────────────────────────────────────────

nextApp.prepare().then(async () => {
  // Dynamic imports so dotenv is loaded first
  const { db } = await import("./src/db");
  const { eq, and } = await import("drizzle-orm");
  const { users, channelMembers, workspaceMembers } = await import(
    "./src/db/schema"
  );
  const { createMessage } = await import("./src/lib/messages");
  const { mentions } = await import("./src/db/schema");
  const { channels: channelsTable } = await import("./src/db/schema");
  const { sendMentionNotification } = await import("./src/lib/email");

  async function isChannelMember(
    userId: string,
    channelId: string
  ): Promise<boolean> {
    const member = await db.query.channelMembers.findFirst({
      where: and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      ),
    });
    return !!member;
  }

  async function getUserWorkspaceIds(userId: string): Promise<string[]> {
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, userId),
      columns: { workspaceId: true },
    });
    return memberships.map((m) => m.workspaceId);
  }

  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ─── Connection handler ──────────────────────────────────────────

  io.on("connection", async (socket) => {
    const userId = await authenticateSocket(socket);

    if (!userId) {
      console.log(
        `[Socket.io] Unauthenticated connection rejected: ${socket.id}`
      );
      socket.disconnect(true);
      return;
    }

    // Track connection
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);
    socketToUser.set(socket.id, userId);

    // Update user status to online
    await db
      .update(users)
      .set({ status: "online" })
      .where(eq(users.id, userId));

    console.log(
      `[Socket.io] User ${userId} connected (socket: ${socket.id})`
    );

    // Broadcast presence to user's workspaces
    const workspaceIds = await getUserWorkspaceIds(userId);
    for (const wsId of workspaceIds) {
      io.to(`workspace:${wsId}`).emit("presence_update", {
        userId,
        status: "online",
      });
    }

    // Auto-join workspace rooms for presence
    for (const wsId of workspaceIds) {
      socket.join(`workspace:${wsId}`);
    }

    // ─── join_channel ────────────────────────────────────────────

    socket.on("join_channel", async (channelId: string) => {
      if (!(await isChannelMember(userId, channelId))) {
        socket.emit("error", { message: "Not a member of this channel" });
        return;
      }
      socket.join(channelId);
    });

    // ─── leave_channel ───────────────────────────────────────────

    socket.on("leave_channel", (channelId: string) => {
      socket.leave(channelId);
    });

    // ─── send_message ────────────────────────────────────────────

    socket.on(
      "send_message",
      async (data: { channelId: string; content: string }) => {
        if (!(await isChannelMember(userId, data.channelId))) {
          socket.emit("error", { message: "Not a member of this channel" });
          return;
        }

        const result = await createMessage(
          data.channelId,
          userId,
          data.content
        );

        if (result.error) {
          socket.emit("error", { message: result.error });
          return;
        }

        io.to(data.channelId).emit("new_message", result.data);

        // Parse @mentions
        const mentionMatches = data.content.match(/@(\w+)/g);
        if (mentionMatches && result.data) {
          const channel = await db.query.channels.findFirst({
            where: eq(channelsTable.id, data.channelId),
          });

          // Get workspace members to match names
          const wsMembers = channel
            ? await db.query.workspaceMembers.findMany({
                where: eq(workspaceMembers.workspaceId, channel.workspaceId),
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                      status: true,
                    },
                  },
                },
              })
            : [];

          const senderUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true },
          });

          for (const match of mentionMatches) {
            const mentionName = match.slice(1).toLowerCase();
            const mentioned = wsMembers.find(
              (m) =>
                (m.user.name || m.user.email.split("@")[0]).toLowerCase() ===
                mentionName
            );

            if (mentioned && mentioned.userId !== userId) {
              // Create mention row
              await db.insert(mentions).values({
                messageId: result.data.id,
                userId: mentioned.userId,
              });

              // Email if offline
              if (!connectedUsers.has(mentioned.userId)) {
                sendMentionNotification(
                  mentioned.user.email,
                  senderUser?.name || "Someone",
                  channel?.name || "a channel",
                  data.content.slice(0, 200),
                  channel?.workspaceId || "",
                  data.channelId
                ).catch(() => {});
              }
            }
          }
        }
      }
    );

    // ─── idle_status / active_status ──────────────────────────────

    socket.on("idle_status", async () => {
      await db
        .update(users)
        .set({ status: "idle" })
        .where(eq(users.id, userId));

      for (const wsId of workspaceIds) {
        io.to(`workspace:${wsId}`).emit("presence_update", {
          userId,
          status: "idle",
        });
      }
    });

    socket.on("active_status", async () => {
      await db
        .update(users)
        .set({ status: "online" })
        .where(eq(users.id, userId));

      for (const wsId of workspaceIds) {
        io.to(`workspace:${wsId}`).emit("presence_update", {
          userId,
          status: "online",
        });
      }
    });

    // ─── typing_start ────────────────────────────────────────────

    socket.on("typing_start", async (channelId: string) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { name: true },
      });
      socket.to(channelId).emit("user_typing", {
        channelId,
        userId,
        userName: user?.name || "Someone",
      });
    });

    // ─── typing_stop ─────────────────────────────────────────────

    socket.on("typing_stop", (channelId: string) => {
      socket.to(channelId).emit("user_stop_typing", {
        channelId,
        userId,
      });
    });

    // ─── disconnect ──────────────────────────────────────────────

    socket.on("disconnect", async () => {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);

          // Only mark offline if no remaining tabs
          await db
            .update(users)
            .set({
              status: "offline",
              lastSeenAt: new Date().toISOString(),
            })
            .where(eq(users.id, userId));

          // Broadcast offline to workspaces
          for (const wsId of workspaceIds) {
            io.to(`workspace:${wsId}`).emit("presence_update", {
              userId,
              status: "offline",
            });
          }
        }
      }
      socketToUser.delete(socket.id);

      console.log(
        `[Socket.io] User ${userId} disconnected (socket: ${socket.id})`
      );
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
