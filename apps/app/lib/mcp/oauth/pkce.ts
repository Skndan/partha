import { createHash, randomBytes } from "crypto";

export function generateCodeVerifier() {
  return randomBytes(64).toString("base64url");
}

export function toCodeChallengeS256(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier, "utf8").digest("base64url");
}
