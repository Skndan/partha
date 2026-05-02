import { randomUUID } from "crypto";

import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";

type CreateNotificationInput = {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  await db.insert(notification).values({
    id: randomUUID(),
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    createdAt: new Date(),
  });
}
