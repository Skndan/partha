"use client";

import { MailIcon, UserRoundIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";

export type MembersTabMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  joinedAt: string;
};

export type MembersTabInvite = {
  id: string;
  email: string;
  role: string;
  teamName: string | null;
  expiresAt: string;
};

export type MembersTabNotification = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
};

function memberInitials(name: string | null, email: string | null) {
  const parts = (name?.trim() || "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase().slice(0, 2);
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e && e.length >= 2) {
    return e.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function MembersWorkspaceTabs({
  members,
  invites,
  notifications,
}: {
  members: MembersTabMember[];
  invites: MembersTabInvite[];
  notifications: MembersTabNotification[];
}) {
  return (
    <Tabs defaultValue="members" className="gap-4">
      <TabsList>
        <TabsTrigger value="members">
          Members
          <Badge variant="secondary" className="ml-2 rounded-sm px-1.5 font-normal tabular-nums">
            {members.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="invites">
          Pending invites
          <Badge variant="secondary" className="ml-2 rounded-sm px-1.5 font-normal tabular-nums">
            {invites.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="mt-0">
        <div className="rounded-lg border bg-card">
          {members.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[140px] text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs">
                            {memberInitials(m.name, m.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium leading-none">{m.name ?? "—"}</p>
                          <p className="mt-1 truncate text-muted-foreground text-xs">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10">
              <Empty>
                <EmptyMedia variant="icon">
                  <UserRoundIcon />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No members yet</EmptyTitle>
                  <EmptyDescription>Invite someone to populate this workspace.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="invites" className="mt-0">
        <div className="rounded-lg border bg-card">
          {invites.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[120px]">Team</TableHead>
                  <TableHead className="w-[140px] text-right">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {inv.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.teamName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10">
              <Empty>
                <EmptyMedia variant="icon">
                  <MailIcon />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No pending invites</EmptyTitle>
                  <EmptyDescription>
                    Invitations you send will show up here until they are accepted.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <div className="rounded-lg border bg-card">
          {notifications.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="w-[180px] text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <p className="font-medium leading-snug">{n.title}</p>
                      {n.body ? (
                        <p className="mt-1 text-muted-foreground text-sm leading-snug">{n.body}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No activity yet</EmptyTitle>
                  <EmptyDescription>
                    Workspace notifications for your account will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
