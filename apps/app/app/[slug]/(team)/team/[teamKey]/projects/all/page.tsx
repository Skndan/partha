import { loadDataTableSearchParams, normalizeDataTableSearchParams } from "@/components/data-table";
import { ProjectPageContent } from "@/components/linear/project-data-table/project-page-content";

import { requireTeamContextFromKey } from "@/lib/workspaces/team-context";
import { getTeamProjectsForDataTable } from "./_lib/query-team-projects";

export default async function TeamProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; teamKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, teamKey } = await params;
  const context = await requireTeamContextFromKey(slug, teamKey);

  const parsedSearchParams = await loadDataTableSearchParams(searchParams);
  const normalizedSearchParams = normalizeDataTableSearchParams(parsedSearchParams, {
    defaultSort: "name",
    defaultOrder: "asc",
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const { rows, totalCount } = await getTeamProjectsForDataTable(
    context.workspaceId,
    context.teamId,
    normalizedSearchParams,
  );

  return (
    <ProjectPageContent
      slug={slug}
      title={`${context.teamName} Projects`}
      description="Projects assigned to this team."
      addLabel="Add project"
      projects={rows}
      totalCount={totalCount}
      teams={[{ id: context.teamId, name: context.teamName }]}
      teamFilterOptions={[{ value: context.teamId, label: context.teamName, count: totalCount }]}
      lockedTeamId={context.teamId}
    />
  );
}
