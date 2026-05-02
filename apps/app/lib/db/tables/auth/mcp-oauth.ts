import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { workspace } from "../linear";

export const mcpOauthAuthorizationCode = pgTable("mcp_oauth_authorization_code", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  clientId: text("client_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  codeHash: text("code_hash").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  codeChallengeMethod: text("code_challenge_method").notNull(),
  scopes: text("scopes").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  usedAt: timestamp("used_at"),
  revokedAt: timestamp("revoked_at"),
});

export const mcpOauthAccessToken = pgTable("mcp_oauth_access_token", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  clientId: text("client_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  encryptedToken: text("encrypted_token").notNull(),
  scopes: text("scopes").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
});
