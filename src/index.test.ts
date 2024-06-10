import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { UnstableDevWorker } from "wrangler";
import { getPlatformProxy, unstable_dev } from "wrangler";

import app from "./index";

// const seed = async (db: DrizzleD1Database<typeof schema>) => {
// 	console.log("seed", db);
// 	await db.delete(users);
// 	await db.insert(users).values({
// 		username: "test",
// 		ip: "test",
// 	});
// };

// d1のenvを取得
const { env } = await getPlatformProxy();

describe("Worker", () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev("./src/index.ts", {
			experimental: { disableExperimentalWarning: true },
		});

		// await seed(getDB(env));
	});

	afterAll(async () => {
		await worker.stop();
	});

	// it("正しくレスポンスが取得できること", async () => {
	// 	const res = await app.request(
	// 		"/users",
	// 		{
	// 			method: "GET",
	// 			headers: { "Content-Type": "application/json" },
	// 		},
	// 		// app内のenv.DBにd1のenvがバインド
	// 		env,
	// 	);

	// 	expect(res.status).toBe(200);
	// 	const responseBody = await res.json();
	// 	console.log({ responseBody });
	// });
});
// });
