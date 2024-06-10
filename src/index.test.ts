import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { UnstableDevWorker } from "wrangler";
import { getPlatformProxy, unstable_dev } from "wrangler";

import { drizzle } from "drizzle-orm/d1"; // いろいろ補完されるので注意
import app from "./index";
import * as schema from "./schema";
import { users } from "./schema";
// d1のenvを取得
const { env } = await getPlatformProxy();

const seed = async () => {
	const db = drizzle(env.DB as D1Database, { schema });

	await db.delete(users);
	await db
		.insert(users)
		.values([
			{ username: "test1", ip: "ip1" },
			{ username: "test2", ip: "ip2" },
			{ username: "test3", ip: "ip3" },
		])
		.execute();
};

describe("Worker", () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev("./src/index.ts", {
			experimental: { disableExperimentalWarning: true },
		});

		await seed();
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
			// app内のenv.DBにd1のenvをバインドする
			env,
		);
		expect(res.status).toBe(200);
		const responseBody = await res.json();
		expect(responseBody).length(3);
	});
});
