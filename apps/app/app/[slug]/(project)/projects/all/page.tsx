import {
  loadDataTableSearchParams,
  normalizeDataTableSearchParams,
} from "@/components/data-table";
import { ProjectPageContent } from "@/components/linear/project-data-table/project-page-content";
import { requireWorkspaceContext } from "@/lib/workspaces/access";
import { getProjectsForDataTable } from "./_lib/query-projects";

export default async function WorkspaceProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const context = await requireWorkspaceContext(slug);

  const parsedSearchParams = await loadDataTableSearchParams(searchParams);
  const normalizedSearchParams = normalizeDataTableSearchParams(parsedSearchParams, {
    defaultSort: "name",
    defaultOrder: "asc",
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  const { rows, totalCount, teamFilterOptions } = await getProjectsForDataTable(
    context.workspaceId,
    normalizedSearchParams,
  );

  const teams = teamFilterOptions
    .filter((item) => item.value !== "none")
    .map((item) => ({ id: item.value, name: item.label }));

  return (
    <ProjectPageContent
      slug={slug}
      title="Projects"
      description="Track delivery streams and connect issues to milestones."
      addLabel="Add project"
      projects={rows}
      totalCount={totalCount}
      teams={teams}
      teamFilterOptions={teamFilterOptions}
    />
  );
}
