# Contributing

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

- `lib/mcp/server.ts`
- `docs/mcp/tools-reference.md`
- `lib/marketing/mcp-tools.ts` (marketing `/mcp` table)

## Docs

Keep docs ASCII-first Markdown; label **planned** work with the standard banner used in `docs/integrations/*.md`.
