import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { and, asc, eq } from "drizzle-orm";

import type { IssueCreatePrefill } from "@/components/linear/issue-data-table/issue-form-dialog";
import {
  type AcceptanceCriteriaItem,
  IssueAcceptanceCriteriaSection,
} from "@/components/linear/issue-detail/issue-acceptance-criteria-section";
import { IssueActivitySection } from "@/components/linear/issue-detail/issue-activity-section";
import { IssueCommentsSection } from "@/components/linear/issue-detail/issue-comments-section";
import { IssueDescriptionEditor } from "@/components/linear/issue-detail/issue-description-editor";
import { IssuePropertiesPanel } from "@/components/linear/issue-detail/issue-properties-panel";
import { IssueRelationsSection } from "@/components/linear/issue-detail/issue-relations-section";
import { IssueSubissuesSection } from "@/components/linear/issue-detail/issue-subissues-section";
import { IssueTitleEditor } from "@/components/linear/issue-detail/issue-title-editor";
import { db } from "@/lib/db/db";
import {
  activityEvent,
  issue,
  issueLabel,
  issueLabelLink,
  issueRelation,
  issueComment,
  issueStatus,
  milestone,
  project,
  team,
  user,
  workspaceMember,
} from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ slug: string; issueId: string }>;
}) {
  const { slug, issueId } = await params;
  const context = await requireWorkspaceContext(slug);

  const [issueRow] = await db
    .select()
    .from(issue)
    .where(and(eq(issue.id, issueId), eq(issue.workspaceId, context.workspaceId)))
    .limit(1);

  if (!issueRow) {
    notFound();
  }

  const [
    statuses,
    teams,
    projects,
    milestones,
    members,
    labels,
    selectedLabels,
    events,
    comments,
    outgoingRelations,
    incomingRelations,
    issues,
    childIssues,
  ] = await Promise.all([
    db
      .select({ id: issueStatus.id, name: issueStatus.name })
      .from(issueStatus)
      .where(eq(issueStatus.workspaceId, context.workspaceId)),
    db
      .select({ id: team.id, key: team.key, name: team.name })
      .from(team)
      .where(eq(team.workspaceId, context.workspaceId)),
    db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(eq(project.workspaceId, context.workspaceId)),
    db
      .select({
        id: milestone.id,
        name: milestone.name,
        projectId: milestone.projectId,
      })
      .from(milestone)
      .where(eq(milestone.workspaceId, context.workspaceId)),
    db
      .select({ id: user.id, name: user.name })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.workspaceId)),
    db
      .select({ id: issueLabel.id, name: issueLabel.name, color: issueLabel.color })
      .from(issueLabel)
      .where(eq(issueLabel.workspaceId, context.workspaceId)),
    db
      .select({ labelId: issueLabelLink.labelId })
      .from(issueLabelLink)
      .where(eq(issueLabelLink.issueId, issueId)),
    db
      .select({
        id: activityEvent.id,
        type: activityEvent.type,
        payload: activityEvent.payload,
        createdAt: activityEvent.createdAt,
        actorName: user.name,
      })
      .from(activityEvent)
      .innerJoin(user, eq(user.id, activityEvent.actorId))
      .where(
        and(
          eq(activityEvent.workspaceId, context.workspaceId),
          eq(activityEvent.issueId, issueId),
        ),
      )
      .orderBy(asc(activityEvent.createdAt)),
    db
      .select({
        id: issueComment.id,
        body: issueComment.body,
        createdAt: issueComment.createdAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(issueComment)
      .innerJoin(user, eq(user.id, issueComment.authorId))
      .where(
        and(
          eq(issueComment.workspaceId, context.workspaceId),
          eq(issueComment.issueId, issueId),
        ),
      )
      .orderBy(asc(issueComment.createdAt)),
    db
      .select({
        id: issueRelation.id,
        type: issueRelation.type,
        issueId: issue.id,
        issueIdentifier: issue.identifier,
        issueTitle: issue.title,
      })
      .from(issueRelation)
      .innerJoin(issue, eq(issue.id, issueRelation.targetIssueId))
      .where(
        and(
          eq(issueRelation.workspaceId, context.workspaceId),
          eq(issueRelation.sourceIssueId, issueId),
        ),
      )
      .orderBy(asc(issueRelation.createdAt)),
    db
      .select({
        id: issueRelation.id,
        type: issueRelation.type,
        issueId: issue.id,
        issueIdentifier: issue.identifier,
        issueTitle: issue.title,
      })
      .from(issueRelation)
      .innerJoin(issue, eq(issue.id, issueRelation.sourceIssueId))
      .where(
        and(
          eq(issueRelation.workspaceId, context.workspaceId),
          eq(issueRelation.targetIssueId, issueId),
        ),
      )
      .orderBy(asc(issueRelation.createdAt)),
    db
      .select({ id: issue.id, identifier: issue.identifier, title: issue.title })
      .from(issue)
      .where(eq(issue.workspaceId, context.workspaceId)),
    db
      .select({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
      })
      .from(issue)
      .where(
        and(eq(issue.workspaceId, context.workspaceId), eq(issue.parentIssueId, issueId)),
      )
      .orderBy(asc(issue.identifier)),
  ]);

  const teamMap = new Map(teams.map((item) => [item.id, item]));
  const backTeam = issueRow.teamId ? teamMap.get(issueRow.teamId) ?? null : null;
  const backHref = backTeam
    ? `/${slug}/team/${backTeam.key}/issues`
    : `/${slug}/projects/all`;
  const statusName = statuses.find((item) => item.id === issueRow.statusId)?.name ?? "Unknown";
  const assigneeName = members.find((item) => item.id === issueRow.assigneeId)?.name ?? "Unassigned";
  const teamName = issueRow.teamId
    ? teams.find((item) => item.id === issueRow.teamId)?.name ?? "Unknown team"
    : "No team";
  const projectName = projects.find((item) => item.id === issueRow.projectId)?.name ?? "No project";
  const milestoneName = issueRow.milestoneId
    ? milestones.find((item) => item.id === issueRow.milestoneId)?.name ?? "Unknown milestone"
    : "No milestone";
  const parentIssueRow = issueRow.parentIssueId
    ? issues.find((item) => item.id === issueRow.parentIssueId)
    : null;
  const parentIssueLabel = parentIssueRow
    ? `${parentIssueRow.identifier} — ${parentIssueRow.title}`
    : "No parent";
  const editorSyncKey = `${issueRow.updatedAt instanceof Date ? issueRow.updatedAt.toISOString() : String(issueRow.updatedAt)}-${issueId}`;
  const acceptanceCriteria: AcceptanceCriteriaItem[] = Array.isArray(issueRow.acceptanceCriteria)
    ? issueRow.acceptanceCriteria
      .filter(
        (item): item is AcceptanceCriteriaItem =>
          Boolean(item) &&
          typeof item === "object" &&
          "id" in item &&
          "text" in item &&
          "checked" in item,
      )
      .map((item) => ({
        id: String(item.id),
        text: String(item.text),
        checked: Boolean(item.checked),
      }))
    : [];

  const dueDatePrefill =
    issueRow.dueDate == null
      ? null
      : typeof issueRow.dueDate === "string"
        ? issueRow.dueDate.slice(0, 10)
        : format(issueRow.dueDate, "yyyy-MM-dd");

  const subIssueCreatePrefill = {
    statusId: issueRow.statusId,
    priority: issueRow.priority,
    teamId: issueRow.teamId,
    projectId: issueRow.projectId,
    milestoneId: issueRow.milestoneId,
    assigneeId: issueRow.assigneeId,
    dueDate: dueDatePrefill,
    estimate: issueRow.estimate,
    labelIds: selectedLabels.map((item) => item.labelId),
    parentIssueId: issueId,
  } satisfies IssueCreatePrefill;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="space-y-3">
          <Link href={backHref} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back to issues
          </Link>
          <IssueTitleEditor
            slug={slug}
            issueId={issueId}
            title={issueRow.title}
            editorKey={editorSyncKey}
          />
          <p className="text-sm text-muted-foreground">{issueRow.identifier}</p>
          <IssueDescriptionEditor
            slug={slug}
            issueId={issueId}
            description={issueRow.description}
            editorKey={editorSyncKey}
          />
          <IssueAcceptanceCriteriaSection
            slug={slug}
            issueId={issueId}
            items={acceptanceCriteria}
          />
        </div>

        <IssueCommentsSection slug={slug} issueId={issueId} comments={comments} />
        <IssueRelationsSection
          slug={slug}
          issueId={issueId}
          relations={[
            ...outgoingRelations.map((relation) => ({
              id: relation.id,
              direction: "outgoing" as const,
              type: relation.type,
              issueId: relation.issueId,
              issueIdentifier: relation.issueIdentifier,
              issueTitle: relation.issueTitle,
            })),
            ...incomingRelations.map((relation) => ({
              id: relation.id,
              direction: "incoming" as const,
              type: relation.type,
              issueId: relation.issueId,
              issueIdentifier: relation.issueIdentifier,
              issueTitle: relation.issueTitle,
            })),
          ]}
        />

        <IssueSubissuesSection
          slug={slug}
          childIssues={childIssues}
          createPrefill={subIssueCreatePrefill}
          statuses={statuses}
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          projects={projects}
          milestones={milestones.map((m) => ({ id: m.id, name: m.name }))}
          members={members}
          labels={labels}
        />

        <IssueActivitySection events={events} />

      </div>

      <aside className="space-y-4">
        <IssuePropertiesPanel
          slug={slug}
          issueId={issueId}
          statusId={issueRow.statusId}
          statusName={statusName}
          priority={issueRow.priority}
          estimate={issueRow.estimate}
          teamId={issueRow.teamId}
          teamName={teamName}
          projectId={issueRow.projectId}
          projectName={projectName}
          milestoneId={issueRow.milestoneId}
          milestoneName={milestoneName}
          assigneeId={issueRow.assigneeId}
          assigneeName={assigneeName}
          dueDate={issueRow.dueDate}
          labelIds={selectedLabels.map((item) => item.labelId)}
          parentIssueId={issueRow.parentIssueId}
          parentIssueLabel={parentIssueLabel}
          statuses={statuses}
          teams={teams}
          projects={projects}
          milestones={milestones}
          members={members}
          labels={labels}
          issues={issues}
        />

      </aside>
    </div>
  );
}
