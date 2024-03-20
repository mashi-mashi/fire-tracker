import { Hono } from 'hono'
import { getDB } from './db'
import { tasks } from './schema'

export type AppBindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: AppBindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/tasks', async (c) => {
  const db = getDB(c)
  const r = await db.select().from(tasks).limit(10).execute()
  console.log('r', r)
  return c.json(r)
})

app.post('/tasks', async (c) => {
  const params = await c.req.json<typeof tasks.$inferInsert>();
  const db = getDB(c)
  const r = await db.insert(tasks).values({
    title: params.title,
    description: params.description,
  }).execute()
  return c.json(r)
})

export default app
