import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthBrandLogoProps = {
  className?: string;
};

/** Theme-aware mark: `/logo/logo-light.svg` (light UI) and `/logo/logo-dark.svg` (dark UI). */
export function AuthBrandLogo({ className }: AuthBrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex shrink-0 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="sr-only">Partha home</span>
      <img
        src="/logo/logo-light.svg"
        alt=""
        width={512}
        height={512}
        className="h-10 w-10 dark:hidden"
      />
      <img
        src="/logo/logo-dark.svg"
        alt=""
        width={512}
        height={512}
        className="hidden h-10 w-10 dark:block"
      />
    </Link>
  );
}
