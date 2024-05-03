import { Hono } from "hono";
import { getDB } from "../db";
import { getOpenAI, summarizeWebPageWithStructuredJSON } from "../openai";
import { contents } from "../schema";
import app, { AppBindings } from "..";


/**
 * コンテンツの要約
 *
 * @param url 要約するURL
 *
 * すでに要約済みの場合はエラーを返す
 */
const summarizeRoute = new Hono<{ Bindings: AppBindings }>()
    .basePath('/summarize')
    .post('/', async (c) => {
        const { url } = await c.req.json<{
            url: string
        }>();
        const ip = c.req.header('CF-Connecting-IP')
        const db = getDB(c)

        const existing = await db.query.contents.findFirst({
            where: (contents, { eq }) => eq(contents.url, url),
        })
        console.log({ existing })
        if (existing) {
            return c.json({
                content: existing,
            })
        }

        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.ip, ip || ''),
        })

        const openai = getOpenAI(c.env.OPENAI_API_KEY)
        const result = await summarizeWebPageWithStructuredJSON(openai, url)

        if (result.type === 'success') {
            const r = await db.insert(contents).values({
                url: result.url,
                title: result.title,
                summary: result.summary,
                tags: result.tags.join(","),
                registeredAt: new Date(),
                registeredBy: user?.id,
            }).execute()
            return c.json(
                {
                    content: r.results[0],
                },
                201
            )
        } else {
            return c.json({ error: `failed to summarize. errorCode: ${result.type}` }, 400)
        }
    })

export { summarizeRoute };