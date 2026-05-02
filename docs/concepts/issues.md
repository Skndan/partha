# Issues

**Issues** are the atomic delivery unit: titles, rich descriptions, statuses, priorities, labels, assignees, relations, comments, sub-issues, and activity.

## Data model (selected)

- `issue` — workspace + optional team/project/milestone/parent issue; `identifier` (human-readable key); `issue_priority_enum`; timestamps for due/completed work.
- `issue_status` — workspace-local columns with `issue_status_type_enum` (`backlog`, `unstarted`, `started`, `completed`, `canceled`).
- `issue_label`, `issue_label_link`
- `issue_assignee` — supplemental assignees vs primary `assigneeId`
- `issue_relation` — `blocks`, `blocked_by`, `relates_to`, `duplicate_of`
- `issue_comment`

## UX

- Tables & dialogs: `components/linear/issue-data-table/*`, `components/linear/create-issue-form.tsx`
- Detail page: `app/[slug]/issues/[issueId]/page.tsx` + `components/linear/issue-detail/*`

## MCP tools

- Reads: `list_issue_statuses`, `list_issues`, `get_issue` (`mcp:read`)
- Writes: `create_issue`, `update_issue` (`mcp:write`)

`create_workspace` seeds default statuses so new workspaces always have a backlog pipeline.
