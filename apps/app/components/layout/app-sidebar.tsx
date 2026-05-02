'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Briefcase,
  ChevronRight,
  FolderKanban,
  Goal,
  Inbox,
  LayoutDashboard,
  Layers,
  MoreHorizontal,
  ScanSearch,
  Users,
  UsersRound,
} from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@workspace/ui/components/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@workspace/ui/components/collapsible'
import type { User } from '@/lib/db/db'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import type { SidebarData } from './types'

export type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  /** When set (e.g. from server session), overrides static sidebar user in the footer */
  user?: Partial<User>
  sidebarData?: SidebarData
  workspaceMenu?: {
    activeSlug: string
    workspaces: Array<{ slug: string; name: string }>
    teams: Array<{ key: string; name: string }>
  }
}

export function AppSidebar({
  user,
  collapsible: collapsibleProp,
  variant: variantProp,
  className,
  sidebarData,
  workspaceMenu,
  ...rest
}: AppSidebarProps) {
  const { collapsible: layoutCollapsible, variant: layoutVariant } = useLayout()
  const pathname = usePathname()
  const router = useRouter()

  const derivedSidebarData = workspaceMenu ? undefined : sidebarData

  if (!workspaceMenu && !derivedSidebarData) {
    return null
  }

  return (
    <Sidebar
      collapsible={collapsibleProp ?? layoutCollapsible}
      variant={variantProp ?? layoutVariant}
      className={className}
      {...rest}
    >
      <SidebarHeader>
        {workspaceMenu ? (
          <TeamSwitcher
            mode='workspace'
            activeSlug={workspaceMenu.activeSlug}
            workspaces={workspaceMenu.workspaces}
            onWorkspaceChange={(nextSlug) => router.push(`/${nextSlug}`)}
          />
        ) : (
          <TeamSwitcher teams={derivedSidebarData!.teams} />
        )}
        {/* Swap TeamSwitcher for <AppTitle /> if you prefer a static title (shadcn-admin pattern). */}
      </SidebarHeader>
      <SidebarContent>
        {workspaceMenu ? (
          <WorkspaceSidebarContent
            activeSlug={workspaceMenu.activeSlug}
            teams={workspaceMenu.teams}
            pathname={pathname}
          />
        ) : (
          derivedSidebarData!.navGroups.map((group) => (
            <NavGroup key={group.title} {...group} />
          ))
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user ?? {
              name: derivedSidebarData?.user.name ?? '',
              email: derivedSidebarData?.user.email ?? '',
              image: derivedSidebarData?.user.avatar ?? '',
            }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function WorkspaceSidebarContent({
  activeSlug,
  teams,
  pathname,
}: {
  activeSlug: string
  teams: Array<{ key: string; name: string }>
  pathname: string
}) {
  const pathnameParts = pathname.split('/').filter(Boolean)
  const teamFromPath =
    pathnameParts[0] === activeSlug && pathnameParts[1] === 'team'
      ? pathnameParts[2]
      : undefined
  const selectedTeamKey = teamFromPath ?? teams[0]?.key ?? ''

  const quickItems = [
    {
      title: 'Dashboard',
      href: `/${activeSlug}`,
      icon: LayoutDashboard,
    },
    // {
    //   title: 'My issues',
    //   href: selectedTeamKey
    //     ? `/${activeSlug}/team/${selectedTeamKey}/issues`
    //     : `/${activeSlug}/projects/all`,
    //   icon: ScanSearch,
    // },
  ] as const

  const workspaceItems = [
    {
      title: 'Projects',
      href: `/${activeSlug}/projects/all`,
      icon: FolderKanban,
    },
    {
      title: 'Teams',
      href: `/${activeSlug}/teams`,
      icon: Users,
    },
    {
      title: 'Members',
      href: `/${activeSlug}/members`,
      icon: Users,
    },
  ] as const

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {quickItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {workspaceItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Your teams</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {teams.length ? (
              teams.map((team) => {
                const issuesHref = `/${activeSlug}/team/${team.key}/issues`
                const projectsHref = `/${activeSlug}/team/${team.key}/projects/all`
                const viewsHref = `/${activeSlug}/team/${team.key}/all`
                const teamIsActive =
                  pathname.startsWith(issuesHref) ||
                  pathname.startsWith(projectsHref) ||
                  pathname.startsWith(viewsHref)

                return (
                  <Collapsible key={team.key} asChild defaultOpen={teamIsActive} className='group/collapsible'>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={team.name} isActive={teamIsActive}>
                          <Users />
                          <span>{team.name}</span>
                          <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className='CollapsibleContent'>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === issuesHref || pathname.startsWith(`${issuesHref}/`)}
                            >
                              <Link href={issuesHref}>
                                <Briefcase />
                                <span>Issues</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === projectsHref || pathname.startsWith(`${projectsHref}/`)}
                            >
                              <Link href={projectsHref}>
                                <FolderKanban />
                                <span>Projects</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === viewsHref || pathname.startsWith(`${viewsHref}/`)}
                            >
                              <Link href={viewsHref}>
                                <LayoutDashboard />
                                <span>Views</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <UsersRound />
                  <span>No teams yet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
