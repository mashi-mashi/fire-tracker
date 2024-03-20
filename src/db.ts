import { drizzle } from "drizzle-orm/d1"; // いろいろ補完されるので注意
import { Context } from "hono";
import { AppBindings } from ".";

export const getDB = (context: Context<{ Bindings: AppBindings }, any, any>) => {
    return drizzle(context.env.DB);
}