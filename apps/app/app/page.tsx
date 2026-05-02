import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { workspace, workspaceMember } from "@/lib/db/schema";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    const [membership] = await db
      .select({ slug: workspace.slug })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
      .where(eq(workspaceMember.userId, session.user.id))
      .orderBy(asc(workspaceMember.joinedAt))
      .limit(1);

    if (membership?.slug) {
      redirect(`/${membership.slug}`);
    }

    redirect("/onboarding");
  }

  return <LoginForm />;
}
