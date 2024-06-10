import { drizzle } from "drizzle-orm/d1"; // いろいろ補完されるので注意
import * as schema from "./schema";

export const getDB = (env: { DB: D1Database }) => {
	console.log("env", env);
	return drizzle(env.DB, { schema, logger: true });
};
