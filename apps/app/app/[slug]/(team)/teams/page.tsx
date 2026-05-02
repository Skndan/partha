import Link from "next/link";
import { eq } from "drizzle-orm";

import { CreateTeamDialog } from "@/components/linear/create-team-dialog";
import { db } from "@/lib/db/db";
import { team, workspaceMember, user } from "@/lib/db/schema";
import { requireWorkspaceContext } from "@/lib/workspaces/access";
import { Heading } from "@workspace/ui/components/heading";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireWorkspaceContext(slug);

  const [teams, members] = await Promise.all([
    db.select().from(team).where(eq(team.workspaceId, context.workspaceId)),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.workspaceId)),
  ]);

  return (
    <div className="space-y-6">
      <Heading
        title="Teams"
        description="Organize people by domain and ownership."
        action={<CreateTeamDialog slug={slug} />}
      />

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Key</th>
              <th className="p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  <Link
                    className="font-medium underline-offset-4 hover:underline"
                    href={`/${slug}/team/${item.key}/all`}
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="p-3">{item.key}</td>
                <td className="p-3 text-muted-foreground">{item.description ?? "-"}</td>
              </tr>
            ))}
            {!teams.length ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={3}>
                  No teams yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 p-3 text-sm font-medium rounded-t-lg">Workspace members</div>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-muted-foreground">{member.email}</p>
              </div>
              <span className="capitalize text-muted-foreground">{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
