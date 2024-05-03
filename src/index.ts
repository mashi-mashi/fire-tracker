import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { getDB } from './db'
import { getOpenAI, summarizeWebPageWithStructuredJSON } from './openai'
import { contents, favorites, users } from './schema'
import puppeteer from "@cloudflare/puppeteer";
import { eq } from 'drizzle-orm'

export type AppBindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  BROWSER: Fetcher
}


const app = new Hono<{ Bindings: AppBindings }>()
app.use(logger())
app.use(prettyJSON())
app.use(secureHeaders())

app.use(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP')
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} from ${ip}`)
  await next()
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/users', async (c) => {
  const db = getDB(c)
  const r = await db.select().from(users).execute()
  return c.json(r)
})

app.get('/users/:id', async (c) => {
  const userId = parseInt(c.req.param('id'))
  if (isNaN(userId)) {
    return c.json({ error: 'invalid user id' }, 400)
  }
  const db = getDB(c)
  const r = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  })
  if (!r) {
    return c.json({ error: 'user not found' }, 404)
  }
  return c.json(r)
})

app.post('/users', async (c) => {
  const params = await c.req.json<{ username: string }>();
  if (!params.username) {
    return c.json({ error: 'username is required' }, 400)
  }
  const ip = c.req.header('CF-Connecting-IP')
  const db = getDB(c)
  const r = await db.insert(users).values({
    username: params.username,
    ip: ip,
  }).execute()
  return c.json(r)
})


app.get('/users/ip', async (c) => {
  const ip = c.req.header('CF-Connecting-IP')
  if (!ip) {
    return c.json({ error: 'ip not found' }, 400)
  }

  const db = getDB(c)
  const r = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.ip, ip),
  })
  if (!r) {
    return c.json({ error: 'user not found' }, 404)
  }
  return c.json(r)
})

/**
 * コンテンツの検索
 *
 * @param url 検索するURL
 */
app.get('/contents/search', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'url is required' }, 400)
  }
  const db = getDB(c)
  const r = await db.query.contents.findFirst({
    where: (contents, { eq }) => eq(contents.url, url),
  })
  if (!r) {
    return c.json({ error: 'content not found' }, 404)
  }
  return c.json(r)
})

app.get('/browse', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'url is required' }, 400)
  }
  console.log('c.env.BROWSER', c.env.BROWSER, c.env)
  const browser = await puppeteer.launch(c.env.BROWSER as any)
  const page = await browser.newPage()
  await page.goto(url)
  const metrics = await page.metrics()
  await browser.close()

  return Response.json(metrics)
})

/**
 * コンテンツの要約
 *
 * @param url 要約するURL
 *
 * すでに要約済みの場合はエラーを返す
 */
app.post('/summarize', async (c) => {
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

app.get('/play', async (c) => {
  const db = getDB(c)
  const userId = 1;
  // const ip = c.req.header('CF-Connecting-IP')
  // if (!ip) {
  //   return c.json({ error: 'ip not found' }, 400)
  // }

  const r = await db.select().from(users).leftJoin(favorites, eq(users.id, favorites.id)).where(
    eq(users.id, 1)
  ).execute()

  return c.json(r)
})

app.get('/play2', async (c) => {
  const db = getDB(c)
  const userId = 1;

  await db.insert(favorites).values(
    {
      userId: userId,
      // contentId: Math.random() * 1000,
    }
  )

  const r = await db.select().from(users).leftJoin(favorites, eq(users.id, favorites.id)).where(
    eq(users.id, userId)
  ).leftJoin(
    contents,
    eq(favorites.contentId, contents.id)
  ).execute()


  return c.json(r)
})


export default app

