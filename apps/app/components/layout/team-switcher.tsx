"use client"

import * as React from "react"
import { Briefcase, ChevronsUpDown, Plus } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@workspace/ui/components/sidebar"

type TeamOption = {
    name: string
    logo: React.ElementType
    plan: string
}

type WorkspaceOption = {
    slug: string
    name: string
}

type TeamSwitcherProps =
    | {
        mode?: "team"
        teams: TeamOption[]
    }
    | {
        mode: "workspace"
        activeSlug: string
        workspaces: WorkspaceOption[]
        onWorkspaceChange: (slug: string) => void
    }

export function TeamSwitcher({
    ...props
}: TeamSwitcherProps) {
    const { isMobile } = useSidebar()
    const isWorkspaceMode = props.mode === "workspace"

    const [activeTeam, setActiveTeam] = React.useState<TeamOption | undefined>(
        !isWorkspaceMode ? props.teams[0] : undefined
    )

    React.useEffect(() => {
        if (!isWorkspaceMode) {
            setActiveTeam((current) => current ?? props.teams[0])
        }
    }, [isWorkspaceMode, props])

    const activeWorkspace = isWorkspaceMode
        ? props.workspaces.find((workspace) => workspace.slug === props.activeSlug) ?? props.workspaces[0]
        : undefined

    if (isWorkspaceMode && !activeWorkspace) {
        return null
    }

    if (!isWorkspaceMode && !activeTeam) {
        return null
    }

    const ActiveTeamLogo = !isWorkspaceMode ? activeTeam?.logo : undefined

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                {isWorkspaceMode ? (
                                    <Briefcase className="size-4" />
                                ) : ActiveTeamLogo ? (
                                    <ActiveTeamLogo className="size-4" />
                                ) : null}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {isWorkspaceMode ? activeWorkspace!.name : activeTeam!.name}
                                </span>
                                <span className="truncate text-xs">
                                    {isWorkspaceMode ? "Workspace" : activeTeam!.plan}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            {isWorkspaceMode ? "Workspaces" : "Teams"}
                        </DropdownMenuLabel>
                        {isWorkspaceMode
                            ? props.workspaces.map((workspace, index) => (
                                <DropdownMenuItem
                                    key={workspace.slug}
                                    onClick={() => props.onWorkspaceChange(workspace.slug)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border">
                                        <Briefcase className="size-3.5 shrink-0" />
                                    </div>
                                    {workspace.name}
                                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            ))
                            : props.teams.map((team, index) => (
                                <DropdownMenuItem
                                    key={team.name}
                                    onClick={() => setActiveTeam(team)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border">
                                        <team.logo className="size-3.5 shrink-0" />
                                    </div>
                                    {team.name}
                                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            ))}
                        {!isWorkspaceMode ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 p-2">
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">Add team</div>
                                </DropdownMenuItem>
                            </>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
