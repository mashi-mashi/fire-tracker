```
npm install
npm run dev
```

```
npm run deploy
```

### Migration

```
npx drizzle-kit generate:sqlite
```

```DB Apply(Local)
npx wrangler d1 migrations apply fire --local
```

```DB Apply(PRODUCTION)
npx wrangler d1 migrations apply fire --remote
```
