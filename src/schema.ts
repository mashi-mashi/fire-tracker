import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'


export const tasks = sqliteTable('tasks', {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["todo", "in-progress", "done"] }).default("todo"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
})

export const users = sqliteTable('users', {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    ip: text("ip").unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
})

export const contents = sqliteTable('contents', {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    summary: text("summary"),
    tags: text("tags"),
    url: text("url"),
    registeredBy: integer("registered_by").references(() => users.id),
    registeredAt: integer("registered_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
})

export const favorites = sqliteTable('favorites', {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id),
    contentId: integer("content_id").references(() => contents.id),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
})