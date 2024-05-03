import puppeteer from "@cloudflare/puppeteer";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { getDB } from "./db";
import { getOpenAI, summarizeWebPageWithStructuredJSON } from "./openai";
import { summarizeRoute } from "./route/summarize";
import { userRoute } from "./route/users";
import { contents, favorites, users } from "./schema";

export type AppBindings = {
	DB: D1Database;
	OPENAI_API_KEY: string;
	BROWSER: Fetcher;
};
export const app = new Hono<{ Bindings: AppBindings }>();

app.use(logger());
app.use(prettyJSON());
app.use(secureHeaders());

app.use(async (c, next) => {
	const ip = c.req.header("CF-Connecting-IP");
	console.log(
		`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} from ${ip}`,
	);
	await next();
});

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

/**
 * コンテンツの検索
 *
 * @param url 検索するURL
 */
app.get("/contents/search", async (c) => {
	const url = c.req.query("url");
	if (!url) {
		return c.json({ error: "url is required" }, 400);
	}
	const db = getDB(c);
	const r = await db.query.contents.findFirst({
		where: (contents, { eq }) => eq(contents.url, url),
	});
	if (!r) {
		return c.json({ error: "content not found" }, 404);
	}
	return c.json(r);
});

// app.get('/browse', async (c) => {
//   const url = c.req.query('url')
//   if (!url) {
//     return c.json({ error: 'url is required' }, 400)
//   }
//   console.log('c.env.BROWSER', c.env.BROWSER, c.env)
//   const browser = await puppeteer.launch(c.env.BROWSER as any)
//   const page = await browser.newPage()
//   await page.goto(url)
//   const metrics = await page.metrics()
//   await browser.close()

//   return Response.json(metrics)
// })

app.route("/", summarizeRoute);
app.route("/", userRoute);

export default app;
