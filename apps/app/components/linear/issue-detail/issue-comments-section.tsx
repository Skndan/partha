import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { IssueCommentForm } from "@/components/linear/issue-comment-form";
import { formatRelativeTime } from "@/lib/format-relative-time";

type IssueCommentItem = {
  id: string;
  body: string;
  createdAt: string | Date;
  authorName: string | null;
  authorImage: string | null;
};

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function IssueCommentsSection({
  slug,
  issueId,
  comments,
}: {
  slug: string;
  issueId: string;
  comments: IssueCommentItem[];
}) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/50 p-3 text-sm font-medium">Comments</div>
      <div className="space-y-4 p-3">
        <IssueCommentForm slug={slug} issueId={issueId} />
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="pb-2">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {comment.authorImage ? <AvatarImage src={comment.authorImage} alt={comment.authorName ?? "User"} /> : null}
                      <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{comment.authorName ?? "Unknown user"}</span>
                  </div>
                  <span title={new Date(comment.createdAt).toLocaleString()}>
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
