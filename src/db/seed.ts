import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as schema from "./schema";

async function seed() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Create test user (emailVerified: 1 so we can test without email flow)
  const hashedPassword = await bcrypt.hash("password123", 10);
  const userId = nanoid();

  await db.insert(schema.users).values({
    id: userId,
    name: "Test User",
    email: "test@example.com",
    emailVerified: 1,
    password: hashedPassword,
    avatarColor: "#0D9488",
  });

  console.log("Created test user: test@example.com / password123");

  // Create a sample workspace
  const workspaceId = nanoid();
  await db.insert(schema.workspaces).values({
    id: workspaceId,
    name: "Test Workspace",
    slug: "test-workspace",
    ownerId: userId,
  });

  // Add user as owner of workspace
  await db.insert(schema.workspaceMembers).values({
    workspaceId,
    userId,
    role: "owner",
  });

  // Create default #general channel
  const channelId = nanoid();
  await db.insert(schema.channels).values({
    id: channelId,
    workspaceId,
    name: "general",
    description: "General discussion",
    isDefault: 1,
    createdBy: userId,
  });

  // Add user to the channel
  await db.insert(schema.channelMembers).values({
    channelId,
    userId,
  });

  console.log("Created workspace 'test-workspace' with #general channel.");
  console.log("Seeding complete.");

  client.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
