# Roadmap

Near-term product direction for Partha beyond what is already shipped.

Partha today ships **workspace collaboration** + **MCP**. This roadmap captures the next layers that turn Partha into an operating suite for SaaS builders.

## Now (shipped)

- Workspaces, teams, projects, milestones, issues (labels, relations, comments, activity)
- Notifications + workspace SSE listener
- MCP OAuth (PKCE), HTTP transport, stdio, workspace-scoped tools through issues

## Next

1. **GitHub** — repo creation per project, commit/PR linkage, issue automation ([`integrations/github.md`](./integrations/github.md)).
2. **Auto changelog** — generated notes from merges + MCP issue transitions ([`automations/auto-changelog.md`](./automations/auto-changelog.md)).
3. **Payments** — Stripe + Razorpay subscriptions & webhooks ([`integrations/payments.md`](./integrations/payments.md)).
4. **Analytics** — product telemetry baseline ([`integrations/analytics.md`](./integrations/analytics.md)).
5. **Marketing channels** — transactional + lifecycle email ([`integrations/marketing.md`](./integrations/marketing.md)).
6. **Database provisioning** — managed Postgres per initiative ([`integrations/databases.md`](./integrations/databases.md)).
7. **Deploy hooks** — environment promotions tied to milestones ([`integrations/deployments.md`](./integrations/deployments.md)).
8. **SaaS bootstrap** — opinionated templates wiring the above ([`automations/saas-bootstrap.md`](./automations/saas-bootstrap.md)).

Ordering may shift based on partner demand; each linked doc tracks intent at the specification level.
