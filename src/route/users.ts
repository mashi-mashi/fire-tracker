import { Hono } from "hono";
import app, { type AppBindings } from "..";
import { getDB } from "../db";
import { users } from "../schema";

const userRoute = new Hono<{ Bindings: AppBindings }>().basePath("/users");

userRoute.get("/", async (c) => {
	const db = getDB(c);
	const r = await db.select().from(users).execute();
	return c.json(r);
});

userRoute.get("/:id", async (c) => {
	const userId = Number.parseInt(c.req.param("id"));
	if (Number.isNaN(userId)) {
		return c.json({ error: "invalid user id" }, 400);
	}
	const db = getDB(c);
	const r = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, userId),
	});
	if (!r) {
		return c.json({ error: "user not found" }, 404);
	}
	return c.json(r);
});

userRoute.post("", async (c) => {
	const params = await c.req.json<{ username: string }>();
	if (!params.username) {
		return c.json({ error: "username is required" }, 400);
	}
	const ip = c.req.header("CF-Connecting-IP");
	const db = getDB(c);
	const r = await db
		.insert(users)
		.values({
			username: params.username,
			ip: ip,
		})
		.execute();
	return c.json(r);
});

userRoute.get("/ip", async (c) => {
	const ip = c.req.header("CF-Connecting-IP");
	if (!ip) {
		return c.json({ error: "ip not found" }, 400);
	}

	const db = getDB(c);
	const r = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.ip, ip),
	});
	if (!r) {
		return c.json({ error: "user not found" }, 404);
	}
	return c.json(r);
});

export { userRoute };
