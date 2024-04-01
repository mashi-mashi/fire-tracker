import { Hono } from 'hono'
import { getDB } from './db'
import { getOpenAI, summarizeWebPageWithStructuredJSON } from './openai'
import { contents, users } from './schema'

export type AppBindings = {
  DB: D1Database
  OPENAI_API_KEY: string
}

const app = new Hono<{ Bindings: AppBindings }>()

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
  if (existing) {
    return c.json({ error: 'already summarized' }, 400)
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
      tags: result.tags.join(','),
      registeredAt: new Date(),
      registeredBy: user?.id,
    }).execute()
    return c.json(r)
  } else {
    return c.json({ error: `failed to summarize. errorCode: ${result.type}` }, 400)
  }
})


export default app
