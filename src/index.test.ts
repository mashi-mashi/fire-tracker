import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { users } from './schema';

import type { UnstableDevWorker } from "wrangler";
import { getPlatformProxy, unstable_dev } from "wrangler";
import app from "./index";
const { env } = await getPlatformProxy();

describe("Worker", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("./src/index.ts", {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("1", () => {
    expect(1).toBe(1);
  })

  // it("should return Hello World", async () => {
  //   const res = await app.request(
  //     "/users",
  //     {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     },
  //     // d1のenvをappの第3引数に渡すと、app内のenv.DBにd1のenvがバインドされる
  //     env
  //   );

  //   console.log(await res.json())

  //   // if (resp) {
  //   //   const text = await resp.text();
  //   //   expect(text).toMatchInlineSnapshot(`"Hello World!"`);
  //   // }
  // });
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
// });