import { redirect } from "next/navigation";

import { docsHref } from "@/lib/marketing/docs-url";

export default function DocsPage() {
  redirect(docsHref());
}
