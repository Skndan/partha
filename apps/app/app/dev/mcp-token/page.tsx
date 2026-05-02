import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DevTokenGenerator } from "@/components/mcp/dev-token-generator";
import { auth } from "@/lib/auth/auth";

export default async function DevMcpTokenPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <DevTokenGenerator />
    </main>
  );
}
