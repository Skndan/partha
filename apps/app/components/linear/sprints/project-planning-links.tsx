import Link from "next/link";

export function ProjectPlanningLinks({
  slug,
  projectId,
  current,
}: {
  slug: string;
  projectId: string;
  current: "overview" | "issues" | "sprints";
}) {
  const base = "text-sm underline-offset-4 hover:underline";
  const muted = "text-muted-foreground";
  const active = "font-medium text-foreground no-underline";

  return (
    <nav aria-label="Project sections" className="flex flex-wrap gap-x-4 gap-y-1">
      <Link
        className={`${base} ${current === "overview" ? active : muted}`}
        href={`/${slug}/project/${projectId}/overview`}
      >
        Overview
      </Link>
      <Link
        className={`${base} ${current === "issues" ? active : muted}`}
        href={`/${slug}/project/${projectId}/issues`}
      >
        Issues
      </Link>
      <Link
        className={`${base} ${current === "sprints" ? active : muted}`}
        href={`/${slug}/project/${projectId}/sprints`}
      >
        Sprints
      </Link>
    </nav>
  );
}
