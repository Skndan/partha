# Notifications & activity

## Notifications

- Table `notification` captures user-targeted signals inside a workspace (read/unread tracking + references to entities).

Surfaced alongside membership tooling on `app/[slug]/members/page.tsx` depending on implementation.

## Activity events

- Table `activity_event` stores structured workspace activity with JSON `payload` (e.g. issue creation).

Issue detail surfaces timeline UI via `components/linear/issue-detail/issue-activity-section.tsx`.

## Related

Issue comments (`issue_comment`) complement activity with conversational context (`components/linear/issue-detail/issue-comments-section.tsx`).
