import { drizzle } from "drizzle-orm/d1"; // いろいろ補完されるので注意
import type { Context } from "hono";
import type { AppBindings } from ".";
import * as schema from "./schema";

export const getDB = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	context: Context<{ Bindings: AppBindings }, string, any>,
) => {
	return drizzle(context.env.DB, { schema, logger: true });
};
