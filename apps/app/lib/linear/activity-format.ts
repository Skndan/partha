type ActivityChange = {
  field: string;
  from: string | null;
  to: string | null;
};

type ActivityPayload = {
  changes?: ActivityChange[];
  title?: string;
  relationType?: string;
  targetIssueIdentifier?: string;
  targetIssueTitle?: string;
};

export function formatActivityMessage(type: string, payload: unknown) {
  const parsed = (payload && typeof payload === "object" ? payload : {}) as ActivityPayload;

  if (type === "issue_created") {
    return "created the issue";
  }

  if (type === "issue_updated") {
    if (parsed.changes?.length) {
      return parsed.changes
        .map((change) => {
          const from = change.from ?? "none";
          const to = change.to ?? "none";
          return `${change.field}: ${from} → ${to}`;
        })
        .join(" · ");
    }
    return "updated the issue";
  }

  if (type === "comment_added") {
    return "added a comment";
  }

  if (type === "relation_added") {
    const target = parsed.targetIssueIdentifier
      ? `${parsed.targetIssueIdentifier}${parsed.targetIssueTitle ? ` — ${parsed.targetIssueTitle}` : ""}`
      : "another issue";
    return `added relation ${String(parsed.relationType ?? "relates_to").replaceAll("_", " ")} to ${target}`;
  }

  if (type === "relation_removed") {
    return "removed a relation";
  }

  return type.replaceAll("_", " ");
}
