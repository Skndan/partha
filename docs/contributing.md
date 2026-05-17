# Contributing

Thanks for improving Partha. Clone [Skndan/partha](https://github.com/Skndan/partha), follow **[getting started](http://localhost:4002/docs/getting-started)** (install and env) in the hosted docs, and use this page for day-to-day conventions. Broader orientation lives in the root **[README](../README.md)**.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): subject`). Allowed types follow project guidelines (feat, fix, docs, style, refactor, perf, test, build, ci, chore).

## Dependencies

Use **Bun** only for package changes:

```bash
bun install <pkg>
bun install -d <dev-pkg>
bun remove <pkg>
```

Do not hand-edit dependency entries for add/remove.

## UI

- Forms: `react-hook-form` + Zod + shadcn `Form` primitives.
- Colors: theme tokens (`bg-primary`, `text-muted-foreground`, etc.) — avoid raw hex/rgb in components.

## shadcn components

```bash
bunx --bun shadcn@latest add <component>
```

## MCP tools

When adding or renaming MCP tools, update:

- `apps/app/lib/mcp/server.ts`
- `apps/docs/content/docs/mcp/tools-reference.mdx`
- `apps/site/lib/marketing/mcp-tools.ts` (marketing `/mcp` table)

## Product docs

Edit Fumadocs content under `apps/docs/content/docs/`. Run `bun run dev:docs` to preview. Label **planned** work with the standard banner used in integration pages.
