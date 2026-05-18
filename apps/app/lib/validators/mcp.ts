import { z } from "zod";

export const RedirectUriSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    if (url.protocol === "https:") {
      return true;
    }
    if (url.protocol === "http:") {
      return (
        url.hostname === "127.0.0.1" ||
        url.hostname === "localhost" ||
        url.hostname === "[::1]"
      );
    }

    // Cursor's native OAuth flow uses a custom URI scheme callback.
    if (url.protocol === "cursor:") {
      return Boolean(url.hostname);
    }

    return false;
  }, "redirect_uri must be https, localhost loopback, or cursor:// callback");

export const AuthorizeQuerySchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: RedirectUriSchema,
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  workspace_slug: z.string().min(1).optional(),
});

export const TokenRequestSchema = z.object({
  grant_type: z.literal("authorization_code"),
  client_id: z.string().min(1),
  code: z.string().min(1),
  redirect_uri: RedirectUriSchema,
  code_verifier: z.string().min(43).max(128),
});

export const RevokeRequestSchema = z.object({
  token: z.string().min(1),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
});

export const ClientRegistrationSchema = z.object({
  client_name: z.string().min(1).optional(),
  grant_types: z.array(z.literal("authorization_code")).optional(),
  response_types: z.array(z.literal("code")).optional(),
  redirect_uris: z.array(RedirectUriSchema).min(1),
  scope: z.string().optional(),
  token_endpoint_auth_method: z.literal("none").optional(),
});
