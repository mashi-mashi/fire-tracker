import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { UnstableDevWorker } from "wrangler";
import { getPlatformProxy, unstable_dev } from "wrangler";

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { getDB } from "./db";
import app from "./index";
import type * as schema from "./schema";
import { users } from "./schema";
// d1のenvを取得
const { env } = await getPlatformProxy();

const seed = async (db: DrizzleD1Database<typeof schema>) => {
	await db.delete(users).execute();
};

describe("Worker", () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev("./src/index.ts", {
			experimental: { disableExperimentalWarning: true },
		});

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		// await seed(getDB(env.DB as any));
	});

	afterAll(async () => {
		await worker.stop();
	});

	it("1", () => {
		expect(1).toBe(1);
	});

	it("正しくレスポンスが取得できること", async () => {
		const res = await app.request(
			"/users",
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
			// app内のenv.DBにd1のenv
			env,
		);
		expect(res.status).toBe(200);
		const responseBody = await res.json();
		console.log({ responseBody });
		// expect(responseBody).toEqual([
		// 	{
		// 		CompanyName: "Alfreds Futterkiste",
		// 		ContactName: "Maria Anders",
		// 		CustomerId: 1,
		// 	},
		// 	{
		// 		CompanyName: "Around the Horn",
		// 		ContactName: "Thomas Hardy",
		// 		CustomerId: 4,
		// 	},
		// 	{
		// 		CompanyName: "Bs Beverages",
		// 		ContactName: "Victoria Ashworth",
		// 		CustomerId: 11,
		// 	},
		// 	{
		// 		CompanyName: "Bs Beverages",
		// 		ContactName: "Random Name",
		// 		CustomerId: 13,
		// 	},
		// ]);
	});

	// it('storage test', async () => {
	//   const mf = new Miniflare({
	//     name: 'main',
	//     modules: true,
	//     script: `
	//     export default {
	//       async fetch(request, env, ctx){
	//         return new Response('Hello World!');
	//       },};
	//     `,
	//     kvNamespaces: ['KV'],
	//     // d1Databases: {
	//     //   DB: '3a056337-d5fc-4e80-ab4f-6ea00b436336'
	//     // },
	//     d1Databases: ['DB'],
	//     r2Buckets: ['BUCKET'],
	//   });

	//   const d1 = await mf.getD1Database('DB');
	//   await d1.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, ip TEXT UNIQUE, created_at INTEGER DEFAULT (strftime('%s', 'now')))`);
	//   const db = drizzle(d1, { schema, logger: true });
	//   await migrate(db, {
	//     migrationsFolder: './drizzle/migrations/',
	//   });

	//   const w = await d1.prepare(`SELECT * FROM sqlite_master WHERE type='table'`).all();
	//   console.log(w)

	//   const r = await db.select().from(users).execute()
	//   console.log(r)
});
