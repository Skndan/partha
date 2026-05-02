> **Status: Planned.** APIs and UI are subject to change.

# Integration: Databases

Vision: provision isolated Postgres (Neon, Supabase, etc.) when projects exit discovery phases.

## Requirements

- Credential leasing + rotation policies.
- Workspace-level billing attribution per database resource.
- Safe teardown flows when projects archive.

## Relation to core schema

Today Partha runs on a single application database (`DATABASE_URL`). Multi-database provisioning will become an integration overlay — not a replacement for core relational data without a migration story.
