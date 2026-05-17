import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { workspace, workspaceMember } from "@/lib/db/schema";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";

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

  return <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
        {/* <a href="#" className="flex items-center gap-2 font-medium"> */}
        {/* <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div> */}
        <AuthBrandLogo />
        {/* </a> */}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xl">
          <LoginForm />
        </div>
      </div>
    </div>
    <div className="relative hidden bg-muted lg:block">
      <img
        src="/placeholder.svg"
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>;
}