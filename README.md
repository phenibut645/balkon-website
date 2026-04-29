# balkon-website

Future Balkon web dashboard (Next.js + TypeScript).

This folder is an independent nested Git repository intended for future remote:
`phenibut645/balkon-website`.

It is not tracked by the main `phenibut645/balkon` repository because root `.gitignore`
contains `balkon-website/`.

## Architecture

- OAuth2 is handled by Fastify API in main Balkon backend.
- Website never stores Discord OAuth client secret.
- Login flow:
  website -> API `/api/auth/discord` -> Discord OAuth2 -> API callback -> httpOnly cookie -> website `/api/me`.

## Local setup

1. `cd balkon-website`
2. `npm install`
3. `copy .env.local.example .env.local`
4. `npm run dev`

Expected local URLs:

- Website: http://localhost:3000
- API: http://localhost:3001

## Notes

- Website calls API with `credentials: include` for session cookie auth.
- Public production usage requires API OAuth/session setup in backend repo.
