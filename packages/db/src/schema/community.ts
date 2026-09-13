import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, index, uniqueIndex, real } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const communityProfile = pgTable("community_profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  styles: jsonb("styles").$type<string[]>().notNull().default([]),
  level: text("level"),
  city: text("city"),
  country: text("country"),
  lat: real("lat"),
  lng: real("lng"),
  trainTogether: boolean("train_together").notNull().default(false),
  visibility: text("visibility").$type<"public" | "members" | "private">().notNull().default("private"),
  badges: jsonb("badges").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const group = pgTable("group", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  visibility: text("visibility").$type<"public" | "private">().notNull().default("public"),
  createdBy: text("created_by").notNull().references(() => user.id),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const groupMember = pgTable("group_member", {
  groupId: uuid("group_id").notNull().references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").$type<"member" | "admin">().notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("group_member_pk").on(t.groupId, t.userId)]);
export const post = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => group.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"text" | "workout" | "progress" | "pr">().notNull().default("text"),
  body: text("body").notNull(),
  attachment: jsonb("attachment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("post_group_idx").on(t.groupId, t.createdAt)]);
export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const reaction = pgTable("reaction", {
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("fire"),
}, (t) => [uniqueIndex("reaction_pk").on(t.postId, t.userId)]);
export const match = pgTable("match", {
  id: uuid("id").primaryKey().defaultRandom(),
  userA: text("user_a").notNull().references(() => user.id, { onDelete: "cascade" }),
  userB: text("user_b").notNull().references(() => user.id, { onDelete: "cascade" }),
  score: real("score").notNull(),
  status: text("status").$type<"suggested" | "accepted" | "declined">().notNull().default("suggested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull(),
  senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("message_thread_idx").on(t.threadId, t.createdAt)]);
export const challenge = pgTable("challenge", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  metric: text("metric").notNull(),
  startsOn: timestamp("starts_on").notNull(),
  endsOn: timestamp("ends_on").notNull(),
  groupId: uuid("group_id").references(() => group.id),
});
export const challengeEntry = pgTable("challenge_entry", {
  challengeId: uuid("challenge_id").notNull().references(() => challenge.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  value: real("value").notNull().default(0),
}, (t) => [uniqueIndex("challenge_entry_pk").on(t.challengeId, t.userId)]);
export const report = pgTable("report", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: text("reporter_id").notNull().references(() => user.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const block = pgTable("block", {
  blockerId: text("blocker_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("block_pk").on(t.blockerId, t.blockedId)]);
