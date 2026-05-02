"use client";

import type { ComponentProps } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { adminSidebarData } from "@/components/layout/data/admin-sidebar-data";
import { modSidebarData } from "@/components/layout/data/mod-sidebar-data";
import type { User } from "@/lib/db/db";

type RoleSidebarProps = Omit<ComponentProps<typeof AppSidebar>, "sidebarData"> & {
  role: "admin" | "moderator";
  user?: Partial<User>;
};

export function RoleSidebar({ role, user, ...rest }: RoleSidebarProps) {
  const sidebarData = role === "admin" ? adminSidebarData : modSidebarData;
  return <AppSidebar user={user} sidebarData={sidebarData} {...rest} />;
}
