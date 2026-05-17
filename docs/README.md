# Partha documentation (GitHub)

Product documentation is published from the Fumadocs app at [`apps/docs`](../apps/docs).

## Hosted docs

- **Local:** `bun run dev:docs` → [http://localhost:4002/docs](http://localhost:4002/docs)
- **Production:** set `NEXT_PUBLIC_DOCS_URL` on the marketing site; `/docs` redirects to the docs app.

Edit product pages under [`apps/docs/content/docs/`](../apps/docs/content/docs/).

## Repository docs (this folder)

| Document | Purpose |
|----------|---------|
| [contributing.md](./contributing.md) | Conventions for contributors |
| [security.md](./security.md) | Auth, sessions, MCP tokens |
| [deploy.md](./deploy.md) | Docker / TLS deployment |

For setup and product topics, use the [hosted documentation](http://localhost:4002/docs) or run `bun run dev:docs` locally.

**Repository:** https://github.com/Skndan/partha
